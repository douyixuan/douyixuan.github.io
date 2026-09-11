---
title:     'CUDA 软件栈测试方法论：从 Differential Testing 到 GPU Compiler Fuzzing'
date:      2026-09-11T18:40:00+08:00
author:    Cedric
draft:     false
summary: "从 CUDA 软件栈测试全貌出发，给出一套面向 Triton/GPU Compiler 的 fuzz 选型与可落地方案：Hypothesis 生成合法程序，Reference/Differential 作为 oracle，Compute Sanitizer 检查内存与并发，mlir-reduce 自动缩减失败用例。"
categories:
  - compiler
tags:
  - cuda
  - triton
  - compiler
  - fuzzing
  - testing
---

做 CUDA 软件栈测试时，最容易掉进两个误区：

1. 把测试理解成“多写一些 testcase”；
2. 把 fuzz 理解成“随机生成一些输入，看会不会 crash”。

对于 GPU Compiler，这两件事都不够。

一个真正有效的测试体系，应该持续回答几个问题：

- 编译器有没有把程序编错？
- Runtime / Driver 的异步和并发语义有没有出错？
- Kernel 数值是否正确？
- 是否存在 OOB、race、barrier 等隐藏问题？
- 一个优化是否带来了性能回退？
- 新 GPU、新 Driver、新 CUDA Toolkit 下是否还能工作？
- 我们能不能自动生成以前没人想到过的程序，并把发现的问题永久变成 regression test？

这篇文章给出我目前认为更适合 CUDA / Triton / GPU Compiler 的测试全貌，并重点设计一套可以真正落地的 fuzz 方案。

---

## 1. CUDA 软件栈测试的全貌

可以把测试对象和质量属性做成一个二维矩阵。

| 层级 | 主要对象 | 重点验证 |
|---|---|---|
| Compiler | Triton/MLIR/LLVM/PTX/ISA | compile correctness、miscompile、crash、hang |
| Runtime | memory、stream、event、graph、launch | API、异步语义、资源生命周期 |
| Driver | context、module、JIT、device | compatibility、异常恢复、压力 |
| Kernel / Library | GEMM、Attention、Atomic、Collective | 数值正确性、性能 |
| Framework | PyTorch、Triton、vLLM、FlashInfer | workload regression |
| Application | LLM / HPC workload | E2E correctness + performance |

质量属性至少包括：

```text
correctness
performance
compatibility
robustness
memory safety
concurrency safety
```

所以完整测试系统不是一层，而是一座金字塔：

```text
                    Real Workload
               vLLM / FlashInfer / HPC
                         ▲
                 Kernel Benchmark
             GEMM / Attention / Atomic
                         ▲
            Differential / Property
               Fuzz / Metamorphic
                         ▲
                 Compiler Tests
          TTIR → TTGIR → LLVM → PTX
                         ▲
                Unit / API Tests
```

越往下：数量多、执行快、定位容易。

越往上：数量少、成本高，但更接近真实用户。

---

## 2. 六类核心测试

### 2.1 Differential Testing：最重要的 correctness oracle

对于 GPU Compiler，我认为最值得投入的是 differential testing。

同一个输入，同时交给两个实现：

```text
                 input
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
 NVIDIA / reference       target backend
        │                     │
      result A              result B
        └──────────┬──────────┘
                   ▼
                 compare
```

对于 Triton backend，可以是：

```text
Triton Program
    ├── NVIDIA backend / PyTorch reference
    └── 自研 backend
                 ↓
              compare
```

比较不能简单写成 `A == B`。

浮点运算受到 FMA、计算顺序和不同 lowering 的影响，所以应该针对 dtype/operator 定义：

```text
atol
rtol
ULP
NaN / Inf policy
```

Reference 的优先级可以设计为：

```text
PyTorch / NumPy reference
        >
成熟 CUDA 实现
        >
Triton interpreter（覆盖支持的场景）
        >
metamorphic property
```

---

### 2.2 Property / Metamorphic Testing：没有 reference 时怎么办

有些 compiler transformation 没有直接 oracle。

这时可以验证“不变量”。

例如：

```text
A @ I ≈ A
0 @ B = 0
transpose(A @ B) ≈ transpose(B) @ transpose(A)
```

对于编译器：

```text
-O0(program) ≈ -O3(program)

before_pass(IR)
      ↓ pass
 after_pass(IR)

semantic(before) == semantic(after)
```

这种测试非常适合找 optimizer miscompile。

---

### 2.3 Sanitizer：结果正确不代表程序正确

GPU 上大量 bug 可能暂时没有影响最终输出：

```text
out-of-bounds
use-after-free
uninitialized memory
race condition
barrier divergence
async ordering error
```

NVIDIA Compute Sanitizer 提供了 memcheck、racecheck、initcheck、synccheck 等工具，可以把它们作为 fuzz 的第二层 oracle。

因此一个 testcase 不应该只有：

```text
output == reference
```

还应该有：

```text
output == reference
AND
sanitizer == clean
```

---

### 2.4 Performance Regression

CUDA 软件栈里 correctness pass 以后，测试还没有结束。

建议分三级：

```text
Micro Benchmark
     ↓
Kernel Benchmark
     ↓
End-to-End Workload
```

例如：

```text
ldmatrix / atomic / memory op
          ↓
GEMM / Attention
          ↓
vLLM / model workload
```

性能数据不要只记录 latency，还应该关注：

```text
latency / throughput
HBM bandwidth
SM utilization
occupancy
register usage
shared memory
compile time
```

性能 gate 也不要简单写成：

```text
latency > baseline * 1.01 => fail
```

更合理的是：

```text
repeat
  ↓
median / p50
  ↓
noise band
  ↓
regression threshold
```

---

### 2.5 Compatibility Matrix

CUDA 软件栈天然存在组合爆炸：

```text
GPU architecture
× driver
× CUDA toolkit
× OS
× compiler
× library
```

不要跑完整 Cartesian Product。

可以分层：

```text
Tier 0: 主力 GPU + 主力环境，PR 必跑
Tier 1: 所有支持 GPU，Nightly
Tier 2: Driver / Toolkit / OS matrix，Weekly / Release
```

---

### 2.6 Real Workload

最终必须回到真实 workload。

对于 Triton / GPU Toolchain，我会固定保留几类 canary：

```text
GEMM
Softmax
Reduction
Atomic
Attention
MoE
vLLM / FlashInfer representative workload
```

底层 testcase 能告诉我们哪里坏了；真实 workload 告诉我们这个软件栈到底还能不能用。

---

# 3. Fuzz 工具怎么选

我的结论是：**不要只选一个 fuzzer。按照输入层级选工具。**

| 工具 | 最适合 | 优点 | 问题 | 定位 |
|---|---|---|---|---|
| Hypothesis | Triton program / operator spec | 结构化生成、property testing、自动 shrink、Python 集成非常好 | 不是传统 native coverage fuzzer | **主方案** |
| libFuzzer | C/C++ parser、MLIR/LLVM library target | in-process、coverage guided、LLVM 集成成熟 | 对复杂合法程序结构表达弱；官方目前主要维护而非继续发展新功能 | 底层补充 |
| AFL++ | CLI/parser/native target | coverage 能力强、persistent mode、高吞吐 | harness 和 corpus 管理成本更高 | 长时间 fuzz campaign |
| mlir-reduce | MLIR failure reduction | 可以自动最小化 IR reproducer | 它不是 fuzzer | failure reducer |
| Compute Sanitizer | GPU runtime execution | memory/race/sync oracle | 运行慢 | Nightly / sampled oracle |

## 为什么主方案选 Hypothesis

Triton compiler fuzz 最大的问题不是“随机性不够”，而是：

> 大部分随机字节根本不是合法程序。

如果直接 fuzz source text：

```text
random bytes
    ↓
parser reject
    ↓
parser reject
    ↓
parser reject
```

大量算力都浪费在语法层。

我们真正想探索的是：

```text
合法程序
  ↓
新的 shape/layout/dtype/control flow 组合
  ↓
compiler pipeline
  ↓
GPU execution
```

Hypothesis 非常适合先生成一个结构化的 `ProgramSpec`，再从它同时生成 Triton kernel 和 reference。

它还有一个关键优势：**shrinking**。

发现失败后，不只是给出一个随机 seed，而是尝试把失败输入缩到更小。

这对于 compiler bug 的定位价值很高。

Triton 社区过去也讨论过类似方向：使用 Hypothesis 描述抽象操作，再同时生成 Triton 和 reference implementation。

---

# 4. 我会怎么设计 Triton Compiler Fuzzer

整体 pipeline：

```text
         ProgramSpec Generator
                │
                ▼
          Validity Filter
                │
                ▼
          Triton Program
           /          \
          /            \
         ▼              ▼
 target backend      reference
         │              │
         └──────┬───────┘
                ▼
          result compare
                │
       ┌────────┴─────────┐
       ▼                  ▼
   sanitizer          properties
       │                  │
       └────────┬─────────┘
                ▼
             failure
                │
                ▼
        shrink / reduce
                │
                ▼
      regression corpus
```

---

## 5. 不要直接生成源码，先生成 ProgramSpec

核心数据结构应该类似：

```python
@dataclass
class ProgramSpec:
    op: str
    shape: tuple[int, ...]
    dtype: str
    block_size: int
    num_warps: int
    num_stages: int
    layout: str
    mask_mode: str
```

第一阶段只支持很小的 operation set：

```text
load
store
add / mul
reduce
mask
broadcast
```

后面再逐渐加入：

```text
dot
atomic
barrier
async copy
TMA
warp specialization
control flow
```

这里的原则是：

> 优先提高“有效程序率”，然后再增加程序复杂度。

---

## 6. 一个最小 Hypothesis 模型

概念代码：

```python
from hypothesis import given, strategies as st

DTYPES = st.sampled_from(["fp16", "fp32", "int32"])
SHAPES = st.sampled_from([1, 2, 7, 31, 32, 33, 127, 128, 129, 256])
WARPS = st.sampled_from([1, 2, 4, 8])

@st.composite
def program_specs(draw):
    return ProgramSpec(
        op=draw(st.sampled_from(["add", "mul", "reduce"])),
        shape=(draw(SHAPES),),
        dtype=draw(DTYPES),
        block_size=draw(st.sampled_from([32, 64, 128, 256])),
        num_warps=draw(WARPS),
        num_stages=draw(st.integers(min_value=1, max_value=5)),
        layout="default",
        mask_mode=draw(st.sampled_from(["none", "boundary"])),
    )

@given(program_specs())
def test_generated_program(spec):
    inputs = make_inputs(spec)

    expected = run_reference(spec, inputs)
    actual = run_triton(spec, inputs)

    assert_close(actual, expected, spec.dtype)
```

真正重要的不是这个 decorator，而是 `ProgramSpec` 的设计。

它实际上定义了：

> compiler 当前被 fuzz 的语义空间。

---

# 7. 输入空间怎么设计

不能只随机普通值，要刻意覆盖 GPU 的边界。

### Shape

```text
0 / 1
warp boundary: 31 / 32 / 33
power of 2 boundary: 127 / 128 / 129
large prime
non-power-of-two
```

### dtype

```text
fp32
fp16
bf16
fp8
int32
int64
mixed precision
```

### memory

```text
aligned / unaligned
contiguous / strided
masked load/store
aliasing
boundary access
```

### launch configuration

```text
num_warps
num_stages
block size
grid shape
```

### compiler feature

```text
layout conversion
broadcast
reduction
atomic
barrier
loop
branch
async pipeline
```

这些维度不要直接做完全随机组合。

应该通过 constraint 保证组合语义有效。

---

# 8. Fuzz Oracle 分四层

我会给每个 fuzz case 设计四级 oracle。

## Level 1：Compiler Oracle

```text
compile success
no crash
no assertion
no timeout
```

这是最便宜的一层，甚至不需要 GPU execution。

适合大量运行。

## Level 2：Differential Oracle

```text
Target Result ≈ Reference Result
```

这是找 miscompile 的核心。

## Level 3：Metamorphic Oracle

同一个程序改变“不应影响语义”的条件：

```text
num_warps A vs B
optimization pipeline A vs B
layout A vs equivalent layout B
-O0 vs optimized
```

然后验证输出等价。

## Level 4：Sanitizer Oracle

抽样运行：

```text
compute-sanitizer memcheck
compute-sanitizer racecheck
compute-sanitizer synccheck
```

因为成本高，不适合每个 PR 的每个 case 都跑。

---

# 9. Failure 必须自动分类

Fuzzer 发现的问题至少分类为：

```text
COMPILE_CRASH
COMPILE_TIMEOUT
RUNTIME_CRASH
WRONG_RESULT
SANITIZER_FAILURE
NON_DETERMINISM
PERFORMANCE_PATHOLOGY
```

每个 failure 保存：

```text
ProgramSpec
random seed
input tensor
compiler version / commit
GPU model
CUDA / Driver version
IR dump
PTX / ISA（如果生成成功）
stderr
```

否则 fuzz 很容易变成“发现了一堆无法复现的随机错误”。

---

# 10. Shrinking 是 compiler fuzz 的关键能力

假设 fuzz 出来的是：

```text
shape = [513, 127]
fp16
num_warps = 8
num_stages = 5
复杂 mask
两个 reduction
三个 layout conversion
```

真正导致 bug 的可能只是：

```text
shape = [33]
fp16
num_warps = 2
一个 masked load
```

因此失败以后应该有两级 shrink：

```text
Hypothesis shrink ProgramSpec
          ↓
得到最小 source/program
          ↓
如果错误已经进入 MLIR
          ↓
mlir-reduce
```

`mlir-reduce` 可以根据 interestingness test 自动删除不影响失败的 operation，是 MLIR pipeline bug 非常合适的第二级 reducer。

---

# 11. Corpus：fuzz 不是一次性随机测试

每次找到新的 bug：

```text
fuzz failure
    ↓
shrink
    ↓
人工确认
    ↓
regression case
    ↓
永久进入 corpus
```

目录可以直接设计成：

```text
fuzz/
├── generators/
├── oracles/
├── runners/
├── reducers/
├── corpus/
│   ├── crash/
│   ├── wrong_result/
│   ├── sanitizer/
│   └── regression/
└── reports/
```

一个成熟的 fuzz 系统不是不断“随机”，而是：

> continuously discover → minimize → understand → preserve。

---

# 12. CI 怎么跑

不要让 fuzz 把 PR CI 拖死。

建议按照预算分层。

### PR

目标：快速发现明显 regression。

```text
fixed regression corpus
+
small Hypothesis fuzz budget
+
compile/differential oracle
```

起始可以限制在几分钟内。

### Nightly

```text
larger generated space
+
more random seeds
+
Compute Sanitizer sampling
+
all supported operations
```

### Weekly / Dedicated Runner

```text
long fuzz campaign
+
coverage-guided native fuzz
+
compatibility matrix
+
new corpus minimization
```

对于 C++ parser / MLIR / LLVM library target，再增加：

```text
libFuzzer or AFL++
```

这就是为什么我不认为 Hypothesis 和 AFL++ 是二选一。

它们分别探索不同层级。

---

# 13. 最推荐的落地路线

如果今天开始做，我不会直接构建一个“大而全 GPU fuzzer”。

### Phase 1：一周内做出 MVP

只 fuzz：

```text
elementwise
mask
reduce
```

只支持：

```text
fp16 / fp32
1D / 2D shape
几个典型 num_warps
```

能力：

```text
Hypothesis generator
PyTorch reference
Target backend execution
assert_close
failure serialization
Hypothesis shrink
```

这个阶段的成功标准不是 code coverage，而是：

> 能稳定地产生合法程序，并自动找到、缩减、复现一个 backend 差异。

### Phase 2：扩展 compiler 语义空间

加入：

```text
layout
broadcast
atomic
control flow
mixed dtype
```

并开始统计：

```text
valid case ratio
compile success ratio
unique failure count
failure reproduction rate
```

### Phase 3：接入 Sanitizer + IR Reduce

```text
Compute Sanitizer
MLIR reproducer
mlir-reduce
```

做到：

```text
发现 bug
  ↓
自动保存 IR
  ↓
自动 reduce
  ↓
生成 regression testcase
```

### Phase 4：coverage-guided native fuzz

再对：

```text
parser
MLIR pass
LLVM translation
PTX generation interfaces
```

增加 libFuzzer / AFL++ target。

---

# 14. 最终测试架构

最终我希望整个 CUDA / Triton 测试体系长这样：

```text
                         Real Workloads
                     vLLM / FlashInfer / HPC
                              │
                    Performance Regression
                              │
                      Kernel Test Suite
                              │
           ┌──────────────────┴──────────────────┐
           │                                     │
    Differential Fuzz                     Sanitizer
 Hypothesis / ProgramSpec          mem/race/sync/init
           │                                     │
           └──────────────────┬──────────────────┘
                              │
                       Compiler Pipeline
                 TTIR → TTGIR → LLVM → PTX
                              │
           ┌──────────────────┴──────────────────┐
           │                                     │
       lit / unit                         native fuzz
                                         libFuzzer/AFL++
```

核心不是某一个工具。

真正需要建设的是：

```text
Generator
+
Oracle
+
Reducer
+
Corpus
+
CI
+
Observability
```

---

# 15. 结论

如果只给一个最小选型：

```text
Triton semantic fuzz:
    Hypothesis

Reference:
    PyTorch / NumPy / mature CUDA implementation

GPU safety oracle:
    Compute Sanitizer

IR reduction:
    mlir-reduce

Native compiler fuzz:
    libFuzzer / AFL++
```

这套组合比“直接找一个 fuzzer 随机轰 compiler”更适合 GPU compiler。

因为我们真正关心的不是随机输入数量，而是：

> 能不能持续生成有意义的新程序，证明它们被正确编译，在出错时把问题缩到足够小，并永久沉淀成测试资产。

这才是 GPU Compiler fuzz 最终应该服务的目标。

---

## References

- Triton repository and testing guidance: https://github.com/triton-lang/triton
- Triton testing and verification discussion: https://github.com/triton-lang/triton/issues/329
- Hypothesis documentation: https://hypothesis.readthedocs.io/
- LLVM libFuzzer: https://llvm.org/docs/LibFuzzer.html
- LLVM fuzzing documentation: https://llvm.org/docs/FuzzingLLVM.html
- AFL++ documentation: https://github.com/AFLplusplus/AFLplusplus
- MLIR Reduce: https://mlir.llvm.org/docs/Tools/mlir-reduce/
- NVIDIA Compute Sanitizer: https://docs.nvidia.com/compute-sanitizer/
- NVIDIA CUDA documentation: https://docs.nvidia.com/cuda/

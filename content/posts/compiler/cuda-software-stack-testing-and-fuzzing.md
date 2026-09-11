---
title:     'CUDA 软件栈测试方法论：从 Differential Testing 到 GPU Compiler Fuzzing'
date:      2026-09-11T18:41:00+08:00
author:    Cedric
draft:     false
summary: "从 CUDA 软件栈测试全貌出发，给出一套面向 Triton/GPU compiler 的 fuzz 测试选型、架构、CI 分层和落地方案。"
categories:
  - compiler
tags:
  - cuda
  - triton
  - gpu
  - compiler
  - testing
  - fuzzing
---

CUDA 软件栈的测试不能只理解成“补更多 testcase”。

它真正要解决的问题是：**如何持续证明一个 GPU 软件栈在不同输入、不同编译路径、不同 GPU、不同 driver/toolkit 环境下，仍然算得对、跑得稳，而且没有明显性能退化。**

对于 GPU compiler / Triton backend，这个问题尤其明显：一个 kernel 能编译、能运行、输出看起来正常，并不意味着整个系统是可信的。

本文给出我目前认为比较实用的一套方法论，并重点设计一套可以真正进入 CI 的 fuzz testing 方案。

---

## 1. 先建立测试全貌：Stack × Quality Attribute

我更倾向于用一个二维模型理解 CUDA 软件栈测试：

> **测试对象（stack layer） × 质量属性（correctness / performance / compatibility / robustness）**

| 层级 | 典型对象 | 主要测试方法 |
| --- | --- | --- |
| Application | vLLM、LLM serving、HPC workload | E2E correctness、吞吐、稳定性 |
| Framework | PyTorch、Triton、FlashInfer | workload regression、API compatibility |
| Kernel / Library | GEMM、Attention、Reduce、Atomic | 数值正确性、性能、sanitizer |
| Runtime | stream、event、memory、graph、launch | API conformance、并发、异步语义 |
| Compiler | TTIR/TTGIR/MLIR/LLVM/PTX | differential、property、fuzz、pass equivalence |
| Driver / Device | context、module、JIT、device | compatibility、stress、recovery |

真正可靠的软件栈，不是其中某一层 testcase 很多，而是每一层都有不同类型的证据。

---

## 2. 六类核心测试

### 2.1 Differential Testing：最重要的 correctness oracle

GPU 软件栈最有价值的测试之一，是让同一个输入经过两个实现，然后比较结果。

```text
                  input
                    |
          +---------+---------+
          |                   |
    reference path        target path
   PyTorch / CUDA        custom backend
          |                   |
          +---------+---------+
                    |
                compare
```

对于 Triton backend，可以直接做：

```text
Triton program
   ├── NVIDIA backend  → result A
   └── 自研 backend     → result B

compare(A, B)
```

reference 不一定永远是 CUDA，也可以是：

- PyTorch eager
- NumPy / CPU reference
- cuBLAS / cuDNN
- 一个更简单但明显正确的 kernel
- 同一 compiler 的 `-O0` / `-O3`

浮点结果不能简单使用 `==`。需要根据 dtype 和 operator 设计 `rtol / atol / ULP`，并特别注意 reduction 顺序、FMA、TF32、FP8 等带来的合法差异。

---

### 2.2 Property / Metamorphic Testing：没有 oracle 时检查不变量

很多 GPU 程序没有一个方便的 reference implementation，此时可以测试数学或语义不变量。

例如矩阵乘法：

```text
A @ I ≈ A
0 @ B = 0
(A @ B).T ≈ B.T @ A.T
```

对于 compiler：

```text
program
  ├── pipeline A → result A
  └── pipeline B → result B

result A ≈ result B
```

例如：

```text
-O0(program) ≈ -O3(program)
before_pass(IR) ≈ after_pass(IR)
num_warps=4 ≈ num_warps=8   # 在语义允许时
```

这类测试对于发现 optimizer miscompile 很有效。

---

### 2.3 Fuzz Testing：主动寻找“没想到的输入”

普通 regression test 的问题是：

> 我们只测试了自己已经想到的情况。

Fuzz testing 的目标恰好相反：系统化地生成没有被人工枚举过的输入组合。

GPU compiler 特别适合 fuzz，因为它天然存在巨大的组合空间：

```text
shape
× dtype
× stride
× alignment
× layout
× mask
× num_warps
× num_stages
× control flow
× atomic
× barrier
× memory pattern
× GPU architecture
```

很多 compiler bug 并不是某一个 feature 单独有问题，而是多个合法条件组合以后出现问题。

---

### 2.4 Sanitizer：发现“结果刚好正确”的非法行为

一个 kernel 输出正确，不代表程序合法。

典型问题包括：

```text
out-of-bounds
misaligned access
uninitialized memory
shared-memory race
barrier divergence
invalid synchronization
```

NVIDIA Compute Sanitizer 当前提供：

- `memcheck`
- `racecheck`
- `initcheck`
- `synccheck`

因此 fuzz 的 oracle 不应该只有数值比较，还应该包含 sanitizer。

---

### 2.5 Performance Regression

GPU 软件栈的 correctness pass 只是起点。

推荐三级 benchmark：

```text
Micro benchmark
      ↓
Kernel benchmark
      ↓
Real workload
```

例如：

```text
load / ldmatrix / atomic
          ↓
GEMM / Attention / Reduce
          ↓
vLLM / FlashInfer / model workload
```

性能结果至少应该保留：

```text
latency
throughput
HBM bandwidth
SM utilization
occupancy
register usage
shared memory
```

性能 gate 不适合直接做：

```text
latency > baseline * 1.01 → fail
```

更合理的是重复运行，使用 median / p50，再结合 noise band 和显著退化阈值。

---

### 2.6 Compatibility Matrix

CUDA 软件栈还有一个普通软件少见的问题：环境组合非常大。

```text
GPU architecture
× driver
× CUDA toolkit
× OS
× compiler
× framework/library version
```

不能跑完整 Cartesian product，所以应该分层：

```text
Tier 0
主力 GPU + 主力 driver/toolkit
每个 PR

Tier 1
所有支持 GPU architecture
Nightly

Tier 2
driver/toolkit/OS compatibility matrix
Weekly / Release
```

---

# 3. Fuzz 工具怎么选

我考虑了四类方案。

| 方案 | 优点 | 缺点 | 适合的位置 |
| --- | --- | --- | --- |
| Hypothesis | Python 集成简单、property-based、自动 shrinking | 不是传统 native coverage-guided fuzzer | Triton/kernel 参数与语义 fuzz |
| libFuzzer | LLVM 原生、coverage-guided、适合 C/C++ | harness 要求高；当前主要进入维护模式 | parser / C++ API / pass library |
| AFL++ | 成熟、coverage-guided、persistent mode 强 | GPU/编译流程集成成本更高 | 长时间 native fuzz campaign |
| CUDAsmith 类 generator | 能生成完整 CUDA program，适合 compiler differential testing | 工程复杂、生成合法且有意义程序困难 | 研究型 compiler fuzz |

## 选型结论

第一阶段我不会直接做“随机生成任意 Triton 程序”。

我会选：

> **pytest + Hypothesis + domain-aware generator + differential oracle**

然后配套：

- **Hypothesis shrink**：缩小 shape/config 等输入
- **mlir-reduce**：缩小 IR reproducer
- **Compute Sanitizer**：检查 memory/race/sync
- **LLVMFuzzerTestOneInput-compatible harness**：覆盖 C++/parser/pass 边界
- **AFL++**：后续用于长时间 native fuzz campaign

原因很简单：这条路线最容易在现有 Triton / GPU compiler 测试体系里快速得到 bug，而不是先花很长时间造一个复杂的 fuzz infrastructure。

Triton 社区早期也有人提出使用 Hypothesis 来随机选择 dtype、shape、broadcast 等参数，并与 PyTorch 结果进行近似比较。这与这里的方向基本一致。

---

# 4. 第一版 fuzz architecture

整体流程：

```text
Seed corpus / kernel templates
            |
            v
     Hypothesis strategy
            |
            v
  shape / dtype / layout / config
            |
            v
      compile + execute
            |
    +-------+--------+----------------+
    |                |                |
reference oracle   property oracle   sanitizer
    |                |                |
    +-------+--------+----------------+
            |
          failure
            |
            v
         shrink
     /             \
Hypothesis        mlir-reduce
     \             /
      minimal reproducer
            |
            v
 regression testcase
```

最关键的一点是：

> **fuzz 找到的 bug 必须自动沉淀成 regression test。**

否则 fuzz 只是在不断重新发现同一类问题。

---

# 5. 不要一开始随机生成任意程序

GPU compiler fuzz 最容易犯的错误，是第一步就尝试生成完整语言。

结果通常是：

```text
大量 invalid program
大量无意义 program
大量 duplicate behavior
很低的真实 compiler path 覆盖率
```

更好的第一步是：

> **固定 kernel skeleton，fuzz 语义相关参数。**

例如从这些 kernel template 开始：

```text
elementwise
reduction
softmax
matmul
attention
atomic
scan
transpose
masked load/store
```

然后 fuzz：

```text
M/N/K
power-of-two / non-power-of-two
0 / 1 / boundary size
fp32 / fp16 / bf16 / int
contiguous / strided
aligned / deliberately awkward alignment
broadcast
mask shape
BLOCK_SIZE
num_warps
num_stages
```

这种方式生成的 case 基本都是“合法、可运行、值得比较”的。

---

# 6. Hypothesis fuzz 示例

一个简化版测试可以长这样：

```python
import torch
from hypothesis import given, settings, strategies as st

shapes = st.tuples(
    st.integers(min_value=1, max_value=1024),
    st.integers(min_value=1, max_value=1024),
)

dtypes = st.sampled_from([
    torch.float16,
    torch.bfloat16,
    torch.float32,
])

@given(shape=shapes, dtype=dtypes)
@settings(max_examples=200, deadline=None)
def test_triton_kernel_fuzz(shape, dtype):
    m, n = shape

    x = torch.randn((m, n), device="cuda", dtype=dtype)

    ref = torch.softmax(x, dim=-1)
    out = triton_softmax(x)

    torch.testing.assert_close(
        out,
        ref,
        rtol=1e-2,
        atol=1e-2,
    )
```

真正的版本应该进一步让 strategy 偏向 edge case，而不是完全均匀采样。

例如 shape 值应该重点覆盖：

```text
1
2
3
7
8
15
16
31
32
33
63
64
65
127
128
129
255
256
257
```

因为大量 GPU bug 都藏在 tile boundary 和非 power-of-two 情况里。

---

# 7. Fuzz target 分四级建设

## Level 1：Kernel parameter fuzz

第一阶段只 fuzz 已知 kernel template。

输入：

```text
shape
dtype
stride
mask
config
```

Oracle：

```text
PyTorch / CUDA reference
```

目标：快速抓 correctness bug。

这是 ROI 最高的一层。

---

## Level 2：Kernel template mutation

第二阶段开始改变 kernel 本身：

```text
load → masked load
store → masked store
add → mul
broadcast
reshape
reduce axis
loop trip count
atomic op
```

这里已经开始接近“程序生成”，但仍然保持 grammar 和语义约束。

---

## Level 3：IR / Pass fuzz

针对：

```text
TTIR
TTGIR
MLIR dialect
LLVM IR
```

做：

```text
seed IR
  ↓
structured mutation
  ↓
verify
  ↓
pass pipeline
  ↓
execute / compare / crash check
```

如果出现 failure：

```text
failing.mlir
    ↓
mlir-reduce
    ↓
minimal.mlir
```

这对于定位某个 pass interaction 的 miscompile 非常重要。

---

## Level 4：Native coverage-guided fuzz

最后才进入 C++ 层面的 coverage-guided fuzz。

典型 target：

```text
parser
IR deserializer
pass options
binary metadata
compiler runtime API
```

建议 harness 使用标准：

```cpp
extern "C" int LLVMFuzzerTestOneInput(
    const uint8_t *data,
    size_t size) {

  // parse / compile / transform
  return 0;
}
```

这样同一个 harness 可以比较方便地接 libFuzzer，也可以进一步接 AFL++。

---

# 8. Fuzz 的 Oracle 设计比 Generator 更重要

一个 fuzz 系统真正难的通常不是“怎么随机生成东西”，而是：

> **怎么知道这个结果错了？**

建议至少有四类 oracle。

## Oracle A：Reference implementation

```text
custom backend ≈ NVIDIA backend
Triton kernel ≈ PyTorch
optimized kernel ≈ simple kernel
```

## Oracle B：Metamorphic relation

例如：

```text
transpose(transpose(x)) == x
reduce(x + 0) == reduce(x)
A @ I ≈ A
```

## Oracle C：Compiler pipeline equivalence

```text
-O0 ≈ -O3
pipeline A ≈ pipeline B
before pass ≈ after pass
```

## Oracle D：Crash / sanitizer

即使无法计算 reference，只要出现：

```text
compiler crash
GPU hang
illegal memory access
race
invalid synchronization
```

本身就已经是有效 failure。

---

# 9. Sanitizer 不要对所有 fuzz case 全量跑

Compute Sanitizer 很有价值，但执行开销比较大。

所以可以分两层：

```text
fast fuzz
    |
    +-- numeric oracle
    +-- crash oracle

sampled / suspicious corpus
    |
    +-- memcheck
    +-- racecheck
    +-- initcheck
    +-- synccheck
```

例如 nightly fuzz 产生 10,000 个 case，只对：

- 新 coverage case
- 新 kernel configuration
- reduction 后的 failure
- 随机抽样 corpus

运行 sanitizer。

---

# 10. CI 怎么接

我会设计三档。

| 阶段 | 内容 | 目标 |
| --- | --- | --- |
| PR | regression + 50~200 个 deterministic fuzz examples | 快速阻止明显回归 |
| Nightly | 每个 target 数千/数万 case + sanitizer sampling | 持续发现新 bug |
| Weekly | cross-GPU + compatibility + long fuzz campaign | 深度覆盖 |

PR 阶段必须强调 reproducibility。

每个 failure 都要记录：

```text
seed
kernel
shape
dtype
config
GPU
compiler revision
driver/toolkit
```

这样 CI failure 才能本地重放。

---

# 11. 一个推荐的 repo 结构

```text
tests/
├── unit/
├── regression/
│   └── issues/
├── differential/
├── fuzz/
│   ├── strategies/
│   │   ├── shape.py
│   │   ├── dtype.py
│   │   ├── layout.py
│   │   └── config.py
│   ├── targets/
│   │   ├── elementwise.py
│   │   ├── reduction.py
│   │   ├── matmul.py
│   │   ├── attention.py
│   │   └── atomic.py
│   ├── corpus/
│   └── reproducers/
├── sanitizer/
├── performance/
└── workload/
```

fuzz framework 和普通 testcase 不应该是两个完全分开的世界。

最理想的生命周期是：

```text
fuzz
 ↓
find bug
 ↓
minimize
 ↓
regression testcase
 ↓
fix
 ↓
permanent CI protection
```

---

# 12. 应该观察哪些 fuzz 指标

不要只统计“跑了多少 case”。

更有意义的是：

```text
unique failures
unique minimized reproducers
new regression tests
compiler coverage delta
valid-case ratio
executions / second
median time to reproduce
median time to minimize
flaky failure ratio
```

最终最重要的指标甚至不是 coverage，而是：

> **这个 fuzz 系统是否持续找到人工 testcase 没找到的问题。**

---

# 13. CUDA 软件栈最终应该形成这样的测试金字塔

```text
                    Real workloads
                 vLLM / applications
                        ▲
                 E2E / compatibility
                        ▲
              Kernel performance tests
                        ▲
       differential / property / fuzz tests
                        ▲
           sanitizer / concurrency tests
                        ▲
              compiler / IR tests
                        ▲
                   unit tests
```

越靠下：

```text
数量多
速度快
确定性强
定位容易
```

越靠上：

```text
数量少
运行慢
环境复杂
但更接近真实用户
```

这两类测试不能互相替代。

---

# 14. 我的落地顺序

如果现在从零开始，我不会先建设一个“大而全 CUDA fuzz 平台”。

我会按下面顺序推进。

### Phase 1：一周内能工作的版本

```text
pytest
+ Hypothesis
+ 5 个 kernel template
+ PyTorch/CUDA differential oracle
+ failure seed/reproducer
```

优先覆盖：

```text
elementwise
reduction
softmax
matmul
atomic
```

### Phase 2：把 fuzz 变成 compiler testing infrastructure

增加：

```text
structured kernel mutation
IR dump
mlir-reduce
Compute Sanitizer sampling
nightly corpus
```

### Phase 3：再做 coverage-guided compiler fuzz

增加：

```text
C++ fuzz targets
LLVMFuzzerTestOneInput harness
libFuzzer / AFL++ campaign
coverage corpus management
cross-GPU execution
```

---

# 15. 最终原则

我现在对 CUDA 软件栈测试的理解可以压缩成一句话：

> **Reference comparison 保证算对，property testing 验证语义不变量，fuzz 主动寻找未知输入，sanitizer 检查并发和内存合法性，benchmark 防止性能退化，compatibility matrix 防止环境回归，real workload 证明最终软件真的可用。**

而 fuzz 的核心也不是“随机”。

它应该是一个闭环：

```text
Generate
   ↓
Execute
   ↓
Oracle
   ↓
Minimize
   ↓
Regression
```

对于 Triton / GPU compiler，我认为最值得先做的不是一个复杂的新 fuzz engine，而是先把这个闭环真正跑起来。

---

## References

- Hypothesis documentation: https://hypothesis.readthedocs.io/
- Triton testing and verification ideas: https://github.com/triton-lang/triton/issues/329
- Triton repository and test instructions: https://github.com/triton-lang/triton
- LLVM libFuzzer: https://llvm.org/docs/LibFuzzer.html
- LLVM fuzzing guide: https://llvm.org/docs/FuzzingLLVM.html
- MLIR Reduce: https://mlir.llvm.org/docs/Tools/mlir-reduce/
- AFL++: https://github.com/AFLplusplus/AFLplusplus
- NVIDIA Compute Sanitizer: https://docs.nvidia.com/compute-sanitizer/ComputeSanitizer/index.html
- CUDAsmith: https://github.com/gongbell/CUDAsmith

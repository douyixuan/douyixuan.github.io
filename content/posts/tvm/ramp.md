***

title:     'Ramp'
date:      2025-11-18T15:48:20+08:00
author:    Cedric
draft:     false
summary:   read more
categories:
tags:
-----

在 TVM (Tensor Virtual Machine) 中，ramp 是向量化表达 (vectorized expression) 的核心构造之一，它用于表示连续等差元素的向量，常见于循环展开、SIMD 指令生成、memory load/store 的地址计算等场景。

## 1. ramp 的定义与向量关系

在 TVM 的 TIR 表达式层面，向量不是一个独立的数据结构，而是通过 PrimExpr 的形状信息 (lanes) 来表示。例如：

```python
ramp(base, stride, lanes)
```

**含义：**

| 参数 | 含义 |
|------|------|
| base | 起始标量值（scalar）|
| stride | 步长（每个 lane 的增量）|
| lanes | 向量长度（多少个元素）|

表达的值为：

```
[base, base+stride, base+2*stride, ..., base+(lanes-1)*stride]
```

即它代表一个等差序列的向量值，在 TVM 中用于表示一组连续地址或线性索引序列。

**示例：**

```python
ramp(0, 1, 4)  =>  [0,1,2,3]
ramp(32, 2, 4) =>  [32,34,36,38]
```

这就是 TVM 表示向量的方式，ramp 本质上就是逻辑向量的一种表达。

## 2. ramp 在向量化中的作用

(1) 用于生成 SIMD Load/Store 地址

SIMD load 一次要读取多个连续地址，TVM 使用 ramp 来构造地址：

```python
A[ramp(i*4, 1, 4)]  =>  load A[i*4 : i*4+4]
```

这会映射到 LLVM IR 里的 <4 x float> load 或 GPU 的 vectorized global load (ld.global.v4.f32) 等。

(2) 用于 loop vectorize（向量化循环）

当 loop 被 pragma vectorize 或 schedule.vectorize()，TVM 会将标量计算展开为基于 ramp 的向量表达。

```python
for i in range(4):
    C[i] = A[i] + B[i]
```

⇒ vectorized

```python
C[ramp(0,1,4)] = A[ramp(0,1,4)] + B[ramp(0,1,4)]
```

(3) 用于线程批量计算（SIMT 与 GPU 向量计算）

在 GPU TensorCore 分块、warp-level MMA、甚至 SPIR-V 中，ramp 被用于构建 lane-based 索引，帮助生成：

* ldmatrix, ld.global.v4.f32
* SPIR-V subgroup operations
* VNNI / AMX / TensorCore packed load/store

## 3. ramp 设计的限制与约束

TVM 对 ramp 的使用有限制，这些限制来自硬件 SIMD 和地址合法性：

❌ **1. stride 必须是常量（整数），不能动态变化**

```python
ramp(i, j, 4)  # j 如果是变量 → 非法
```

硬件 SIMD 只支持固定步长访问，不支持动态 stride。

❌ **2. 不能嵌套 ramp（即不能出现 ramp(ramp(…))）**

```python
ramp(ramp(0, 1, 4), 2, 4)  # 非法表达
```

因为 ramp 代表向量，嵌套递增不符合硬件语义，也没法 lower 到 LLVM 或 SPIR-V。

✔ **3. lanes 必须匹配硬件支持的 vector width**

常见限制：

| 硬件 | 合法 lanes |
|------|-----------|
| x86 SSE | 2, 4 |
| AVX2 | 4, 8 |
| AVX512 | 8, 16 |
| ARM NEON | 4, 8, 16 |
| NVIDIA TensorCore/LDG | 2, 4, 8, 16 |

TVM 在 lowering 时会检查是否能够生成合法的 LLVM <lanes x ty> 类型，否则回退为标量循环。

❌ **4. ramp 只能用于连续元素访问，不能表示非规则索引**

例如以下是不支持的：

```python
# 偶数索引访问
[0,2,4,6]   可用 ramp(0,2,4) 表达    ✔

# 交错访问: [0,1, 10,11]  不能用 ramp 表达    ✘
# 随机访问: [3,7,5,8]     必须使用 Shuffle     ✘
```

TVM 有 tir.Shuffle 来表达不规则访问。

❌ **5. ramp 不能跨越越界或跨 buffer loads**

TVM 静态检查索引是否越界，如果 ramp 导致访问超过 buffer 边界，必须转换成 predicated load 或 masked load。

✔ **6. 可以与 broadcast、vector arithmetic 组合**

```python
ramp(0, 1, 4) + broadcast(10,4) → [10,11,12,13]
```

## 4. TVM 中 ramp 与其他向量表达的关系

| 表达式类型 | 含义 | 使用场景 |
|-----------|------|---------|
| ramp(base,stride,lanes) | 线性等差向量 | load/store 索引生成 |
| broadcast(value,lanes) | 同值向量 | 常数、参数向量 |
| vector\<T,l> | LLVM/SPIR-V 具体向量 | Lowering 后的真实向量 |
| tir.Shuffle(vectors, indices) | 非规则向量构造 | gather/scatter、bitcast |
| tir.Load(buffer, index, predicate) | 含 predication 向量 load | mask-based load |

## 5. 总结：核心理解

| 问题 | 本质 |
|------|------|
| ramp 是向量吗？ | 是向量的一种特定表达形式，用于线性索引构造 |
| 能否表示任意向量？ | 否，只能表示等差序列，非规则向量用 Shuffle |
| stride 是否可以动态？ | 不行，必须是 compile-time 常量 |
| 是否能直接映射到 SIMD？ | 是，常用于 load/store、loop vectorize |
| 如果不满足条件？ | 回退为标量循环或 masked load |

---
title:     'Triton Matmul Digest'
date:      2025-07-24T20:26:28+08:00
author:    Cedric
draft:     false
summary:   read more
categories:
tags:
---

# Triton矩阵乘法Kernel深度解析

## 概述

本文深入分析Triton编写的矩阵乘法kernel，重点解释分块累加机制、内存访问模式和并行执行策略。

## 代码示例

```python
import torch 
import triton 
import triton.language  as tl 

@triton.jit 
def matmul_kernel(
    a_ptr, b_ptr, c_ptr,  # 矩阵指针
    M, N, K,  # 矩阵维度 
    stride_am, stride_ak,  # A的步长 
    stride_bk, stride_bn,  # B的步长 
    stride_cm, stride_cn,  # C的步长 
    BLOCK_SIZE: tl.constexpr,   # 分块大小 
):
    # 获取程序ID
    pid = tl.program_id(axis=0) 
    # 计算当前块处理的C矩阵范围 
    rm = pid * BLOCK_SIZE + tl.arange(0,  BLOCK_SIZE)
    rn = tl.arange(0,  BLOCK_SIZE)
    # 初始化累加器
    acc = tl.zeros((BLOCK_SIZE,  BLOCK_SIZE), dtype=tl.float32) 

    # 分块乘法累加
    for k in range(0, K, BLOCK_SIZE):
        a = tl.load(a_ptr  + rm[:, None] * stride_am + k * stride_ak, mask=rm[:, None] < M)
        b = tl.load(b_ptr  + k * stride_bk + rn[None, :] * stride_bn, mask=rn[None, :] < N)
        acc += tl.dot(a,  b)

    # 存储结果 
    tl.store(c_ptr  + rm[:, None] * stride_cm + rn[None, :] * stride_cn, acc)

def matmul(a, b):
    # 验证输入
    assert a.shape[1]  == b.shape[0],  "Incompatible dimensions"
    M, K = a.shape 
    K, N = b.shape 
    # 分配输出
    c = torch.empty((M,  N), device=a.device,  dtype=a.dtype) 
    # 计算网格大小 
    grid = lambda META: (triton.cdiv(M,  META['BLOCK_SIZE']),)
    # 启动内核 
    matmul_kernel[grid](
        a, b, c, M, N, K,
        a.stride(0),  a.stride(1), 
        b.stride(0),  b.stride(1), 
        c.stride(0),  c.stride(1), 
        BLOCK_SIZE=32 
    )
    return c

# 测试代码
if __name__ == "__main__":
    a = torch.randn(128, 64, device='cuda', dtype=torch.float32)
    b = torch.randn(64, 256, device='cuda', dtype=torch.float32)
    c = matmul(a, b)
    print(c.shape)  # 应该输出 (128, 256)
    print(c)  # 打印结果矩阵
```

## 分块累加详解

### 循环次数与数据加载

以上述示例为例，输入矩阵维度：
- A: (128, 64)  
- B: (64, 256)
- C: (128, 256)
- BLOCK_SIZE = 32

**循环次数**：
```python
for k in range(0, K, BLOCK_SIZE):  # K=64, BLOCK_SIZE=32
```
循环次数：64 / 32 = **2次**，k的值分别为0和32。

**每次循环的内存加载**：

第1次循环 (k=0)：
- **A块形状**: (32, 32) - 从A矩阵的列0-31加载32列数据
- **B块形状**: (32, 32) - 从B矩阵的行0-31加载32行数据
- **运算**: `tl.dot(a, b)` 执行 (32×32) × (32×32) 的矩阵乘法
- **结果**: 得到 (32, 32) 的中间结果矩阵

第2次循环 (k=32)：
- **A块形状**: (32, 32) - 从A矩阵的列32-63加载32列数据  
- **B块形状**: (32, 32) - 从B矩阵的行32-63加载32行数据
- **运算**: `tl.dot(a, b)` 执行 (32×32) × (32×32) 的矩阵乘法
- **结果**: 得到 (32, 32) 的中间结果矩阵

**累加过程**：
```python
acc += tl.dot(a, b)
```
- **初始**: `acc` 是 (32, 32) 的零矩阵
- **第1次累加后**: `acc` = 第1次dot运算结果 (32×32)
- **第2次累加后**: `acc` = 第1次结果 + 第2次结果 (32×32)

累加完成后，`acc` 包含了当前工作组负责的C矩阵的一个(32, 32)块的完整计算结果。

## 并行执行策略

### Kernel内部与Grid的分工

**Kernel内部的职责**：
- 只关心一个固定的(BLOCK_SIZE, BLOCK_SIZE)输出块
- 在K维度上进行分块累加
- 处理局部计算

```python
rm = pid * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)  # 固定的行范围
rn = tl.arange(0, BLOCK_SIZE)                     # 固定的列范围

# 只需要在K维度上分块累加
for k in range(0, K, BLOCK_SIZE):
    a = tl.load(...)  # A的(32, 32)块
    b = tl.load(...)  # B的(32, 32)块
    acc += tl.dot(a, b)  # 累加中间结果
```

**Grid的职责**：
- 负责并行调度，覆盖整个输出矩阵
- 启动多个kernel实例

```python
grid = lambda META: (triton.cdiv(M, META['BLOCK_SIZE']),)
# 对于M=128: 启动4个kernel实例
# pid=0: 处理C[0:32, 0:32]
# pid=1: 处理C[32:64, 0:32] 
# pid=2: 处理C[64:96, 0:32]
# pid=3: 处理C[96:128, 0:32]
```

### 设计思想

分工明确：
- **Kernel**: 专注计算一个小块，处理K维度的累加
- **Grid**: 负责并行调度，覆盖整个输出矩阵

每个kernel实例是一个"工作单元"，独立计算一个输出块，通过大量并行的工作单元来加速整个矩阵乘法。其实要想独立计算一个输出块，也只能在完整的K维度上实现。参考[矩阵乘法分块原理文章](https://www.zhihu.com/tardis/zm/art/133330692?source_id=1003)。

## 内存访问模式详解

### 指针计算过程

以A矩阵加载为例：
```python
a = tl.load(a_ptr + rm[:, None] * stride_am + k * stride_ak, mask=rm[:, None] < M)
```

**rm的维度变化**：
```python
rm = pid * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)
# 假设pid=0, BLOCK_SIZE=32
# rm = [0, 1, 2, ..., 31]  # 形状: (32,) 一维数组

rm[:, None]  # 将rm从(32,)变成(32, 1)的二维数组
# [[0],
#  [1], 
#  [2],
#  ...
#  [31]]
```

**矩阵A的内存布局**：
对于矩阵A(128, 64)，按行主序存储：
```python
stride_am = 64  # 行步长：每行有64个元素
stride_ak = 1   # 列步长：相邻列元素间距为1

# A[i,j]的内存地址 = a_ptr + i * stride_am + j * stride_ak
#                  = a_ptr + i * 64 + j * 1
```

**第1次循环 (k=0, pid=0) 的地址计算**：
```python
rm[:, None] * stride_am = [[0],   * 64 = [[0],
                           [1],          [64],
                           [2],          [128],
                           ...           ...
                           [31]]         [1984]]

k * stride_ak = 0 * 1 = 0

# 最终地址对应A矩阵的：
A[0, 0:32]   # 第0行，列0-31
A[1, 0:32]   # 第1行，列0-31  
A[2, 0:32]   # 第2行，列0-31
...
A[31, 0:32]  # 第31行，列0-31
```

**为什么使用[:, None]**：
通过`rm[:, None]`将一维索引变成二维，可以利用广播机制一次性计算出整个块的所有地址，而不需要循环。这是Triton中高效内存访问的关键技巧。

## 为什么使用正方形块？

### 1. 内存访问模式的对称性
对于矩阵乘法 C = A × B：
- **A矩阵访问**：按行读取数据（连续内存访问）
- **B矩阵访问**：按列读取数据（跨步内存访问）

使用正方形块可以让A和B的访问模式更加对称。

### 2. 缓存效率
正方形块能更好地利用缓存：
- **空间局部性**：正方形块在内存中的布局更紧凑
- **时间局部性**：数据被重复使用的次数相等

例如，32×32的块：
- A的每行被重用32次
- B的每列被重用32次
- 重用次数相等，缓存效率最优

### 3. 计算单元利用率
现代GPU/处理器的计算单元通常设计为处理方形数据块：
- **Tensor Core**：通常是16×16或32×32
- **向量处理单元**：对称的SIMD操作
- **并行度平衡**：行和列方向的并行度相等

### 4. 算法复杂度
对于N×N的正方形块，矩阵乘法需要：
- **内存读取**：2N²次（A和B各N²）
- **计算操作**：N³次乘加运算
- **计算密度**：N³/(2N²) = N/2

正方形块能达到最优的计算密度比。

### 5. 通用性与简单性
虽然某些矩形块可能有更好的计算密度，但正方形块提供了：
- **通用性**：适合各种矩阵尺寸
- **简单性**：编程和调优更容易
- **硬件友好**：与硬件设计更匹配
- **数值稳定性**：避免极端的长宽比

## 总结

Triton矩阵乘法kernel的核心设计思想是：
1. **分而治之**：将大矩阵分解为小块并行处理
2. **内核专一**：每个kernel只负责一个输出块的计算
3. **高效内存访问**：使用广播机制优化内存访问模式
4. **正方形分块**：平衡计算效率和硬件适配性

这种设计充分利用了GPU的并行计算能力和内存层次结构，是高性能矩阵乘法实现的典型范例。

---
title:     'Mlir Lowering'
date:      2025-07-25T17:19:12+08:00
author:    Cedric
draft:     false
summary:   read more
categories:
tags:
---

```mermaid
graph TD
    A[源代码] --> B[AST 解析]
    B --> C[MLIR 方言转换]
    C --> D[方言优化]
    D --> E[Lowering 到 LLVM IR]
    E --> F[LLVM 优化]
    F --> G[目标代码生成]
    
    style A fill:#e1f5fe
    style G fill:#c8e6c9
    style C fill:#fff3e0
    style E fill:#f3e5f5
```

# MLIR Linalg 到 LLVM 的 Lowering 过程

本文档详细展示了 MLIR 中 Linalg 方言到 LLVM IR 的 lowering 过程。Linalg 是 MLIR 中用于表示高级张量操作的方言，它提供了丰富的张量操作原语，这些操作最终需要被转换为底层的 LLVM IR 才能执行。

## 1. Linalg 结构化操作分组

**说明**：这一组包括 `linalg.generic`、`linalg.fill`、`linalg.copy` 等通用张量操作。它们通常会先经过 bufferization（张量到内存的转换），再通过 SCF（结构化控制流）降级为循环，最终转为 LLVM IR。

**Lowering 路径**：
- **Linalg → Bufferization**：张量操作转换为内存操作
- **Bufferization → SCF**：内存操作转换为结构化控制流
- **SCF → LLVM IR**：控制流转换为 LLVM 函数和指令

```mermaid
graph TD
    subgraph "Linalg 结构化操作"
        L1[Linalg.generic]
        L2[Linalg.fill]
        L3[Linalg.copy]
    end
    
    subgraph "Bufferization 层"
        B1[memref.alloc]
        B2[memref.copy]
        B3[memref.load]
        B4[memref.store]
    end
    
    subgraph "SCF 层"
        S1[scf.for]
        S2[scf.parallel]
    end
    
    subgraph "LLVM IR 层"
        LL1[llvm.func]
        LL2[llvm.load]
        LL3[llvm.store]
        LL4[llvm.add]
    end
    
    %% Linalg 结构化操作到 Bufferization 的 lowering
    L1 --> B1
    L1 --> B2
    L2 --> B1
    L3 --> B2
    
    %% Bufferization 到 SCF 的 lowering
    B1 --> S1
    B2 --> S1
    B3 --> S1
    B4 --> S1
    
    %% SCF 到 LLVM IR 的 lowering
    S1 --> LL1
    S2 --> LL1
    
    %% 直接到 LLVM IR 的 lowering
    B1 --> LL2
    B2 --> LL3
    B3 --> LL2
    B4 --> LL3
    
    style L1 fill:#e3f2fd
    style L2 fill:#e3f2fd
    style L3 fill:#e3f2fd
    style B1 fill:#f3e5f5
    style B2 fill:#f3e5f5
    style B3 fill:#f3e5f5
    style B4 fill:#f3e5f5
    style S1 fill:#e8f5e8
    style S2 fill:#e8f5e8
    style LL1 fill:#ffebee
    style LL2 fill:#ffebee
    style LL3 fill:#ffebee
    style LL4 fill:#ffebee
```

## 2. Linalg 矩阵操作分组

**说明**：这一组包括 `linalg.matmul`、`linalg.batch_matmul`、`linalg.conv_2d`、`linalg.conv_3d` 等矩阵和卷积相关操作。这些操作通常涉及复杂的嵌套循环和大量的算术运算。

**Lowering 路径**：
- **Linalg → Bufferization**：矩阵操作转换为内存分配和访问
- **Bufferization → SCF**：内存操作转换为嵌套循环结构
- **SCF → Arith**：循环体中的计算转换为算术操作
- **Arith → LLVM IR**：算术操作转换为 LLVM 指令

```mermaid
graph TD
    subgraph "Linalg 矩阵操作"
        L1[Linalg.matmul]
        L2[Linalg.batch_matmul]
        L3[Linalg.conv_2d]
        L4[Linalg.conv_3d]
    end
    
    subgraph "Bufferization 层"
        B1[memref.alloc]
        B2[memref.copy]
        B3[memref.subview]
    end
    
    subgraph "SCF 层"
        S1[scf.for]
        S2[scf.parallel]
        S3[scf.if]
    end
    
    subgraph "Arith 层"
        A1[arith.addi]
        A2[arith.muli]
        A3[arith.cmpi]
    end
    
    subgraph "LLVM IR 层"
        LL1[llvm.func]
        LL2[llvm.load]
        LL3[llvm.store]
        LL4[llvm.add]
        LL5[llvm.mul]
        LL6[llvm.icmp]
    end
    
    %% Linalg 矩阵操作到 Bufferization 的 lowering
    L1 --> B1
    L1 --> B2
    L2 --> B1
    L2 --> B2
    L3 --> B1
    L3 --> B2
    L4 --> B1
    L4 --> B2
    
    %% Bufferization 到 SCF 的 lowering
    B1 --> S1
    B2 --> S1
    B3 --> S1
    
    %% SCF 到 Arith 的 lowering
    S1 --> A1
    S1 --> A2
    S2 --> A1
    S2 --> A2
    S3 --> A3
    
    %% Arith 到 LLVM IR 的 lowering
    A1 --> LL4
    A2 --> LL5
    A3 --> LL6
    
    %% SCF 到 LLVM IR 的 lowering
    S1 --> LL1
    S2 --> LL1
    S3 --> LL1
    
    style L1 fill:#e3f2fd
    style L2 fill:#e3f2fd
    style L3 fill:#e3f2fd
    style L4 fill:#e3f2fd
    style B1 fill:#f3e5f5
    style B2 fill:#f3e5f5
    style B3 fill:#f3e5f5
    style S1 fill:#e8f5e8
    style S2 fill:#e8f5e8
    style S3 fill:#e8f5e8
    style A1 fill:#fff3e0
    style A2 fill:#fff3e0
    style A3 fill:#fff3e0
    style LL1 fill:#ffebee
    style LL2 fill:#ffebee
    style LL3 fill:#ffebee
    style LL4 fill:#ffebee
    style LL5 fill:#ffebee
    style LL6 fill:#ffebee
```

## 3. Linalg 归约操作分组

**说明**：这一组包括 `linalg.reduce`、`linalg.reduce_window`、`linalg.scan`、`linalg.sort` 等归约与排序操作。这些操作需要遍历张量并执行累积或比较操作，通常涉及复杂的控制流逻辑。

**Lowering 路径**：
- **Linalg → Bufferization**：归约操作转换为内存访问模式
- **Bufferization → SCF**：内存访问转换为循环和条件控制
- **SCF → Arith**：归约逻辑转换为算术和比较操作
- **Arith → LLVM IR**：算术操作转换为 LLVM 指令

```mermaid
graph TD
    subgraph "Linalg 归约操作"
        L1[Linalg.reduce]
        L2[Linalg.reduce_window]
        L3[Linalg.scan]
        L4[Linalg.sort]
    end
    
    subgraph "Bufferization 层"
        B1[memref.alloc]
        B2[memref.load]
        B3[memref.store]
        B4[memref.subview]
    end
    
    subgraph "SCF 层"
        S1[scf.for]
        S2[scf.parallel]
        S3[scf.if]
        S4[scf.while]
    end
    
    subgraph "Arith 层"
        A1[arith.addi]
        A2[arith.muli]
        A3[arith.cmpi]
        A4[arith.select]
    end
    
    subgraph "LLVM IR 层"
        LL1[llvm.func]
        LL2[llvm.load]
        LL3[llvm.store]
        LL4[llvm.add]
        LL5[llvm.mul]
        LL6[llvm.icmp]
        LL7[llvm.select]
    end
    
    %% Linalg 归约操作到 Bufferization 的 lowering
    L1 --> B1
    L1 --> B2
    L1 --> B3
    L2 --> B1
    L2 --> B2
    L2 --> B3
    L3 --> B1
    L3 --> B2
    L3 --> B3
    L4 --> B1
    L4 --> B2
    L4 --> B3
    
    %% Bufferization 到 SCF 的 lowering
    B1 --> S1
    B2 --> S1
    B3 --> S1
    B4 --> S1
    
    %% SCF 到 Arith 的 lowering
    S1 --> A1
    S2 --> A1
    S3 --> A3
    S4 --> A3
    
    %% Arith 到 LLVM IR 的 lowering
    A1 --> LL4
    A2 --> LL5
    A3 --> LL6
    A4 --> LL7
    
    %% SCF 到 LLVM IR 的 lowering
    S1 --> LL1
    S2 --> LL1
    S3 --> LL1
    S4 --> LL1
    
    style L1 fill:#e3f2fd
    style L2 fill:#e3f2fd
    style L3 fill:#e3f2fd
    style L4 fill:#e3f2fd
    style B1 fill:#f3e5f5
    style B2 fill:#f3e5f5
    style B3 fill:#f3e5f5
    style B4 fill:#f3e5f5
    style S1 fill:#e8f5e8
    style S2 fill:#e8f5e8
    style S3 fill:#e8f5e8
    style S4 fill:#e8f5e8
    style A1 fill:#fff3e0
    style A2 fill:#fff3e0
    style A3 fill:#fff3e0
    style A4 fill:#fff3e0
    style LL1 fill:#ffebee
    style LL2 fill:#ffebee
    style LL3 fill:#ffebee
    style LL4 fill:#ffebee
    style LL5 fill:#ffebee
    style LL6 fill:#ffebee
    style LL7 fill:#ffebee
```

## 总结

MLIR 的 Linalg 方言提供了丰富的张量操作原语，这些操作通过不同的 lowering 路径最终转换为 LLVM IR。主要的 lowering 步骤包括：

1. **Bufferization**：将张量操作转换为内存操作
2. **SCF Lowering**：将内存操作转换为结构化控制流
3. **Arith Lowering**：将算术操作转换为底层指令
4. **LLVM IR Generation**：最终生成 LLVM IR

这种分层设计使得 MLIR 能够：
- 保持高级操作的语义清晰性
- 提供灵活的优化机会
- 支持不同的目标平台
- 实现渐进式的 lowering 过程

## 4. Linalg 变换操作分组

**说明**：这一组包括 `linalg.transpose`、`linalg.reshape`、`linalg.broadcast`、`linalg.pad`、`linalg.slice` 等张量变换操作。这些操作主要涉及张量的形状变换和索引计算，有些可以直接转换为 LLVM 的指针操作。

**Lowering 路径**：
- **Linalg → Bufferization**：变换操作转换为内存视图和索引计算
- **Bufferization → SCF**：复杂变换转换为循环结构
- **SCF → Arith**：索引计算转换为算术操作
- **Arith → LLVM IR**：算术操作转换为 LLVM 指令
- **直接路径**：部分操作可直接转换为 LLVM 的 `getelementptr` 指令

```mermaid
graph TD
    subgraph "Linalg 变换操作"
        L1[Linalg.transpose]
        L2[Linalg.reshape]
        L3[Linalg.broadcast]
        L4[Linalg.pad]
        L5[Linalg.slice]
    end
    
    subgraph "Bufferization 层"
        B1[memref.alloc]
        B2[memref.subview]
        B3[memref.cast]
        B4[memref.copy]
    end
    
    subgraph "SCF 层"
        S1[scf.for]
        S2[scf.parallel]
        S3[scf.if]
    end
    
    subgraph "Arith 层"
        A1[arith.addi]
        A2[arith.muli]
        A3[arith.cmpi]
        A4[arith.select]
    end
    
    subgraph "LLVM IR 层"
        LL1[llvm.func]
        LL2[llvm.load]
        LL3[llvm.store]
        LL4[llvm.add]
        LL5[llvm.mul]
        LL6[llvm.icmp]
        LL7[llvm.getelementptr]
    end
    
    %% Linalg 变换操作到 Bufferization 的 lowering
    L1 --> B2
    L1 --> B4
    L2 --> B2
    L2 --> B4
    L3 --> B2
    L3 --> B4
    L4 --> B1
    L4 --> B2
    L5 --> B2
    L5 --> B4
    
    %% Bufferization 到 SCF 的 lowering
    B1 --> S1
    B2 --> S1
    B3 --> S1
    B4 --> S1
    
    %% SCF 到 Arith 的 lowering
    S1 --> A1
    S1 --> A2
    S2 --> A1
    S2 --> A2
    S3 --> A3
    
    %% Arith 到 LLVM IR 的 lowering
    A1 --> LL4
    A2 --> LL5
    A3 --> LL6
    A4 --> LL6
    
    %% SCF 到 LLVM IR 的 lowering
    S1 --> LL1
    S2 --> LL1
    S3 --> LL1
    
    %% 直接到 LLVM IR 的 lowering
    B2 --> LL7
    B3 --> LL7
    
    style L1 fill:#e3f2fd
    style L2 fill:#e3f2fd
    style L3 fill:#e3f2fd
    style L4 fill:#e3f2fd
    style L5 fill:#e3f2fd
    style B1 fill:#f3e5f5
    style B2 fill:#f3e5f5
    style B3 fill:#f3e5f5
    style B4 fill:#f3e5f5
    style S1 fill:#e8f5e8
    style S2 fill:#e8f5e8
    style S3 fill:#e8f5e8
    style A1 fill:#fff3e0
    style A2 fill:#fff3e0
    style A3 fill:#fff3e0
    style A4 fill:#fff3e0
    style LL1 fill:#ffebee
    style LL2 fill:#ffebee
    style LL3 fill:#ffebee
    style LL4 fill:#ffebee
    style LL5 fill:#ffebee
    style LL6 fill:#ffebee
    style LL7 fill:#ffebee
```


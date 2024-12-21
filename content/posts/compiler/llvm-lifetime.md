---
title:     'LLVM Lifetime'
date:      2024-07-17T17:48:26+08:00
author:    Cedric
draft:     false
summary:   read more
categories:
tags:
- llvm
---

In LLVM, variable lifetime management is closely tied to the concepts of scope, allocation, and memory management within the Intermediate Representation (IR). Here’s how LLVM handles variable lifetime:

### 1. **Stack Allocation with `alloca`**

- **Description:** `alloca` is used to allocate memory on the stack. The memory allocated by `alloca` is automatically freed when the function returns.
- **Scope:** Limited to the function in which it is defined.
- **Lifetime:** The lifetime of variables allocated with `alloca` is limited to the duration of the function execution.

**Example:**

```llvm
define i32 @example() {
entry:
  %x = alloca i32, align 4
  store i32 42, i32* %x
  %val = load i32, i32* %x, align 4
  ret i32 %val
}
```

In this example, `%x` is a variable allocated on the stack, and its lifetime is limited to the `example` function.

### 2. **Global Variables**

- **Description:** Global variables are allocated in the global memory space and are accessible from any function within the module.
- **Scope:** Global across the entire module.
- **Lifetime:** The lifetime of global variables spans the entire execution of the program.

**Example:**

```llvm
@global_var = global i32 0

define void @set_global() {
entry:
  store i32 42, i32* @global_var
  ret void
}
```

Here, `@global_var` is a global variable whose lifetime lasts for the duration of the program.

### 3. **Heap Allocation (Using External Libraries)**

- **Description:** LLVM itself does not provide built-in heap allocation, but you can use external functions (like `malloc` and `free` from the C standard library) to manage heap memory.
- **Scope:** Managed manually by the programmer.
- **Lifetime:** The lifetime is determined by explicit `malloc` and `free` calls.

**Example:**

```llvm
declare i8* @malloc(i64)
declare void @free(i8*)

define i8* @allocate() {
entry:
  %ptr = call i8* @malloc(i64 4)  ; allocate 4 bytes
  ret i8* %ptr
}

define void @deallocate(i8* %ptr) {
entry:
  call void @free(i8* %ptr)
  ret void
}
```

In this example, memory is allocated on the heap using `malloc`, and its lifetime is managed by explicitly calling `free`.

### 4. **SSA (Static Single Assignment) Form**

- **Description:** LLVM uses SSA form, where each variable is assigned exactly once. This simplifies analysis and optimization.
- **Scope:** Typically limited to a basic block or function, depending on the variable's usage.
- **Lifetime:** Determined by the dominance frontier in SSA form, which helps the compiler to understand where each variable is live.

**Example:**

```llvm
define i32 @ssa_example(i32 %a, i32 %b) {
entry:
  %sum = add i32 %a, %b
  %mul = mul i32 %sum, 2
  ret i32 %mul
}
```

In SSA form, `%sum` and `%mul` are assigned only once and their lifetimes are limited to their usage within the function.

### 5. **Lifetime Intrinsics**

LLVM provides intrinsics to give hints about the lifetime of variables, which can be used to optimize memory usage.

- **`llvm.lifetime.start` and `llvm.lifetime.end`:** These intrinsics indicate the start and end of a variable's lifetime.

**Example:**

```llvm
define void @lifetime_example() {
entry:
  %x = alloca i32, align 4
  call void @llvm.lifetime.start(i64 4, i8* %x)
  store i32 42, i32* %x
  call void @llvm.lifetime.end(i64 4, i8* %x)
  ret void
}
```

In this example, `llvm.lifetime.start` and `llvm.lifetime.end` indicate the variable `%x`'s lifetime, helping the optimizer to manage stack space efficiently.

### Summary

- **Stack Allocation (`alloca`):** Variables are allocated on the stack and are automatically freed when the function returns.
- **Global Variables:** Variables have a global scope and exist for the entire duration of the program.
- **Heap Allocation:** Managed manually using external functions like `malloc` and `free`.
- **SSA Form:** Ensures each variable is assigned only once, simplifying analysis and optimization.
- **Lifetime Intrinsics:** Provide hints to the optimizer about variable lifetimes to manage memory more efficiently.

Understanding these mechanisms allows LLVM to efficiently manage variable lifetimes and optimize memory usage during the compilation process.

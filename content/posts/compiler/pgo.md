---
title:     'Pgo'
date:      2025-02-27T15:46:03+08:00
author:    Cedric
draft:     true
summary:   read more
categories:
tags:
---

### Clang 实现 PGO 的原理分析：再来一个通俗版

Profile-Guided Optimization（PGO）是编译器的一种“聪明玩法”，它通过观察程序真实运行时的行为，帮助 Clang 生成更快、更高效的代码。就像厨师做菜前先问你口味偏好，然后根据你的喜好调整配方，而不是瞎猜着做。Clang 的 PGO 实现简单又强大，下面我们再用一个新角度讲讲它的原理，加个例子，再推荐点实用的输入和 GitHub 开源项目。

---

#### 1. PGO 的核心：先摸底，再优化

想象你是个快递员，每天送包裹但不知道哪条路最堵。PGO 就像是你先带着 GPS 跑几天，记下哪条路快、哪条路慢，然后根据这些记录规划最佳路线。Clang 的 PGO 也是这个逻辑，分三步走：

- **埋点记录（插桩）**  
  编译时，Clang 在代码里加些“记号笔”，记录程序跑的时候都干了啥。比如某个函数被调用了多少次，某个 if 判断走哪条路最多。这一步用的是 `-fprofile-generate`。

- **跑一跑，攒数据**  
  你得拿插过桩的程序跑一些代表性的任务，记号笔会把运行信息写进一个文件（`.profraw`），相当于“行车记录仪”的原始视频。

- **带着数据再编译**  
  用工具把原始数据整理成“分析报告”（`.profdata`），然后第二次编译时加上 `-fprofile-use`，Clang 就会根据这份报告调整代码，让程序跑得更顺。

---

#### 2. Clang 内部咋玩的？

Clang 的 PGO 靠的是 LLVM 的中间表示（IR）层操作，简单说就是把代码翻译成一种“半成品”语言，然后在这上面动手脚。过程是这样的：

- **插桩时**  
  在 IR 层，Clang 给每个关键点（函数入口、分支跳转）加个计数器。比如“这个函数跑了 100 次”“这个 else 只走了 5 次”。这些计数器就像超市门口的客流量统计器。

- **收集时**  
  程序跑的时候，计数器把数据记下来，存成 `.profraw` 文件。跑完后，用 `llvm-profdata` 把这些乱糟糟的数字整理成一个清晰的 `.profdata`，有点像把一堆收据整理成账本。

- **优化时**  
  Clang 拿着 `.profdata`，开始“因材施教”：
  - 常用函数直接“抄作业”（内联），省去跳转。
  - 热门代码放一起，CPU 缓存命中率更高。
  - 分支预测更准，走得多的路径优先安排。

---

#### 3. 再来个例子

这次我们写个简单的排序程序，看看 PGO 怎么优化：

```c
#include <stdio.h>
#include <stdlib.h>

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

void bubble_sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(&arr[j], &arr[j + 1]);
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    bubble_sort(arr, n);
    printf("Sorted array: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\n");
    return 0;
}
```

**步骤 1：插桩编译**
```bash
clang -O2 -fprofile-generate sort.c -o sort
```

**步骤 2：跑程序**
```bash
./sort
```
跑完生成 `default.profraw`。

**步骤 3：整理数据**
```bash
llvm-profdata merge -output=sort.profdata default.profraw
```

**步骤 4：优化编译**
```bash
clang -O2 -fprofile-use=sort.profdata sort.c -o sort-optimized
```

**效果**  
优化后的 `sort-optimized` 可能更快，因为 Clang 发现 `swap` 函数被频繁调用，可能会内联它；或者知道 `if (arr[j] > arr[j + 1])` 的判断规律，调整代码顺序让 CPU 预测更准。

---

#### 4. PGO 的输入数据推荐

PGO 的关键是“跑啥样的数据”，这决定了优化是不是真有用。以下是几种常用输入：

- **测试用例**：项目自带的单元测试，覆盖主要功能。
- **压力测试**：用工具模拟高负载，比如 `stress` 或 `sysbench`。
- **日志回放**：如果有用户日志，拿来重现真实场景。
- **随机输入**：比如给排序程序喂一堆随机数组，模拟各种情况。

最好挑能代表程序日常工作的数据，别光跑边界情况，不然优化可能会偏离实际需求。

---

#### 5. GitHub 开源推荐

再推荐几个跟 PGO 相关的开源项目，供你参考：

1. **Clang PGO 文档和例子**  
   - GitHub: [llvm/llvm-project](https://github.com/llvm/llvm-project/tree/main/clang)  
   - 官方仓库里有 PGO 的详细说明和示例代码，直接上手试试。

2. **AutoFDO（自动 PGO 工具）**  
   - GitHub: [google/autofdo](https://github.com/google/autofdo)  
   - Google 开源的工具，可以从性能分析器（perf）生成 PGO 数据，适合不想手动跑测试的场景。

3. **Perf（Linux 性能分析）**  
   - GitHub: [brendangregg/perf-tools](https://github.com/brendangregg/perf-tools)  
   - 虽然不是直接的 PGO 工具，但可以用它收集运行数据，配合 AutoFDO 生成 PGO 输入。

4. **PGO-Bench**  
   - GitHub: [pgo-bench/pgo-bench](https://github.com/pgo-bench/pgo-bench)  
   - 一个专门测试 PGO 效果的基准项目，里面有不少预设场景可以借鉴。

5. cargo-pgo（Rust 用，但思路通用）
   - GitHub: [Kobzol/cargo-pgo](https://github.com/Kobzol/cargo-pgo)
   - 一个封装 PGO 流程的工具，虽然是为 Rust 设计的，但它的脚本和思路可以借鉴到 C/C++ 项目。

6. Google Benchmark
   - GitHub: [google/benchmark](https://github.com/google/benchmark)
   - 一个轻量级的基准测试库，可以用来生成 PGO 的输入数据，特别适合性能敏感的项目。

7. pgo-rust（展示 PGO 效果的例子）
   - GitHub: [Geal/pgo-rust](https://github.com/Geal/pgo-rust)
   - 一个用 Rust 测试 LLVM PGO 的项目，里面有详细的编译和优化步骤，可以参考它的 Makefile。

---

#### 6. 总结

Clang 的 PGO 就像给程序装了个“导航仪”，先跑一圈摸清路况，再重新规划路线。它的实现靠插桩、数据收集和优化三步走，简单但效果显著。用上面那个排序例子试试，你会发现优化后的代码跑得更顺手。输入数据选得好，PGO 就能事半功倍。去 GitHub 上玩玩那些项目，动手试一把，PGO 的威力你就懂了！
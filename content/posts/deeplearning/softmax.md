---
title:     'Softmax'
date:      2025-08-26T14:01:30+08:00
author:    Cedric
draft:     true
summary:   read more
categories:
tags:
---

# 📑 在线 Softmax 整理

## 1. 背景

softmax 定义为：

$$
\text{softmax}(x_i) = \frac{e^{x_i}}{\sum_j e^{x_j}}
$$

数值稳定版：

$$
\text{softmax}(x_i) = \frac{e^{x_i - m}}{\sum_j e^{x_j - m}},\quad m = \max_j x_j
$$

**减去最大值** 是工程实现里的 **数值稳定技巧**，数学定义里并没有这一项。

### ⚠️ 为什么要引入 max？

* 如果 $x_i$ 很大，比如 1000，直接算 $e^{1000}$ 会溢出（变成 inf）。
* 减去一个常数 $m$ 并不会改变 softmax 的结果，因为：

  $$
  \frac{e^{x_i - m}}{\sum_j e^{x_j - m}}
  = \frac{e^{x_i}}{e^m \sum_j e^{x_j}}
  $$

  分子分母同除以 $e^m$，值不变。

所以：
📖 **公式里没写 max，是因为定义不需要；实现里加上 max，是为了稳定。**

### 在线 softmax

在线 softmax 的目标：**单遍扫描数据**，动态维护最大值和和式，避免两次显存读取。

---

## 2. 核心维护量

* 当前最大值：$m$
* 累积和：

  $$
  s = \sum_{\text{已处理 } j} e^{x_j - m}
  $$

---

## 3. 更新规则

对新元素 $x$：

* **若 $x \le m$：**

  $$
  s \gets s + e^{x - m}
  $$

* **若 $x > m$：**

  $$
  s \gets s \cdot e^{m - x} + 1,\quad m \gets x
  $$

解释：

* 缩放旧的和：把旧的基准 $m$ 转到新基准 $x$；
* 新最大元素本身贡献 $e^{0} = 1$。

---

## 4. 完整流程

1. 初始化：$m = -\infty, \ s = 0$
2. 扫描输入，依规则更新 $m, s$
3. 再遍历一次：

   $$
   \text{softmax}(x_i) = \frac{e^{x_i - m}}{s}
   $$

---

## 5. 伪代码

```python
m = -float("inf")
s = 0.0
for x in row:
    if x <= m:
        s += math.exp(x - m)
    else:
        s = s * math.exp(m - x) + 1.0
        m = x

# 归一化
out = [math.exp(x - m) / s for x in row]
```

---

## ✅ 总结

* 在线 softmax = **单遍 reduce**，避免多次显存读取。
* 通过动态更新最大值和和式，保证数值稳定。
* 实际应用中广泛用于 GPU 上的 **attention 加速 (FlashAttention)**。

---
title:     'Attention'
date:      2025-07-10T15:24:31+08:00
author:    Cedric
draft:     false
summary:   read more
categories:
tags:
---

### 注意力机制的通用公式

最常见的注意力机制形式是**缩放点积注意力（Scaled Dot-Product Attention）**，它也是 Transformer 模型中使用的基本形式。它的总公式可以写为：

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

拆解一下这个公式的每个部分：

1.  **$Q$ (Query 查询)**：
    * $Q$ 是一个矩阵，它的每一行代表一个**查询向量**。你可以把它想象成“我想知道什么”或者“我现在关注的焦点”。
    * 形状：$n \times d_k$ (其中 $n$ 是查询的数量， $d_k$ 是查询向量的维度)。

2.  **$K$ (Key 键)**：
    * $K$ 是一个矩阵，它的每一行代表一个**键向量**。你可以把它想象成序列中每个元素的“标签”或“索引”，用于与 $Q$ 进行匹配。
    * 形状：$m \times d_k$ (其中 $m$ 是键的数量， $d_k$ 是键向量的维度)。注意，为了能进行点积，`Key` 和 `Query` 的维度必须相同。

3.  **$V$ (Value 值)**：
    * $V$ 是一个矩阵，它的每一行代表一个**值向量**。你可以把它想象成序列中每个元素的“内容”或“信息本身”。
    * 形状：$m \times d_v$ (其中 $m$ 是值的数量， $d_v$ 是值向量的维度)。注意，`Value` 的数量与 `Key` 的数量相同，但维度可以与 `Key` 和 `Query` 不同。

4.  **$QK^T$ (点积相似度)**：
    * 这是 $Q$ 矩阵和 $K$ 矩阵的转置 ($K^T$) 的乘积。
    * 形状：$(n \times d_k) \times (d_k \times m) = n \times m$。
    * 这一步计算了每个**查询**与每个**键**之间的**相似度分数**（或称作**注意力分数**）。点积的结果越大，表示查询和键越相关。

5.  **$\sqrt{d_k}$ (缩放因子)**：
    * $d_k$ 是查询和键向量的维度。
    * 除以 $\sqrt{d_k}$ 是为了进行**缩放**。这样做是为了防止当 $d_k$ 很大时，点积结果变得过大，导致 softmax 函数的梯度非常小（进入饱和区），从而影响训练的稳定性。这个操作有助于保持梯度稳定。

6.  **$\text{softmax}(\cdot)$ (归一化)**：
    * 这是一个激活函数，它将之前计算得到的相似度分数转换为**注意力权重**。
    * Softmax 函数确保所有的权重都在 0 到 1 之间，并且对于每个查询，其所有键的注意力权重之和为 1。这表示了每个值对当前查询的“重要性”或“贡献度”的概率分布。
    * 形状仍然是 $n \times m$。

7.  **$(\cdot)V$ (加权求和)**：
    * 最后，将归一化后的注意力权重矩阵与 $V$ 矩阵相乘。
    * 形状：$(n \times m) \times (m \times d_v) = n \times d_v$。
    * 这一步实现了**加权求和**：每个值向量 $V_i$ 会乘以它对应的注意力权重。最终的输出是一个新的矩阵，其中每一行都包含了融合了注意力信息的向量，这些向量根据查询的重要性对原始信息进行了汇总。


这个公式简洁地概括了注意力机制的三个核心步骤：

1.  **计算相似度** ($QK^T$)：衡量查询和每个键之间的相关性。
2.  **归一化权重** ($\text{softmax}(\cdot)$)：将相似度转换为概率分布的注意力权重。
3.  **加权求和** ($(\cdot)V$)：根据权重，对值进行加权组合，得到最终的注意力输出。

---

### 什么是注意力机制？

想象一下你正在阅读一本书。当你读到某个词的时候，你的大脑并不会平等地关注书里的每一个字。相反，你会根据上下文，把更多的注意力放在与当前词相关的其他词语上，以此来理解它的意思。

在 AI 领域，尤其是自然语言处理（NLP）中，**注意力机制**就模拟了人类的这种“选择性关注”能力。它允许模型在处理一个序列（比如一句话）中的某个元素时，能够动态地评估并“关注”到序列中其他与该元素相关的部分，并为它们分配不同的“重要性”权重。

简单来说，注意力机制就是：

1.  **打分**：衡量序列中每个元素与当前关注元素之间的相关性。
2.  **加权**：根据相关性分数，为每个元素分配一个权重。
3.  **求和**：将所有元素按权重加权求和，得到一个“融合了注意力信息”的表示。

### 为什么需要注意力机制？

在注意力机制出现之前，循环神经网络（RNN）等模型在处理长序列时会遇到“信息遗忘”的问题。序列越长，模型就越难记住早期输入的信息。注意力机制的引入有效地解决了这个问题，让模型能够：

  * **处理长距离依赖**：无论序列有多长，模型都能直接“看到”并关注到序列中任意位置的相关信息。
  * **提升模型性能**：通过加权机制，模型可以更好地理解数据中的复杂关系，从而提高在翻译、摘要、问答等任务上的表现。
  * **提供可解释性**：我们可以通过注意力权重来查看模型在做决策时“关注”了哪些部分，这有助于理解模型的内部工作方式。


## 训练过程中 QKV 参数的计算和Embedding 的过程

### 训练中的 QKV 参数计算：从词到注意力

在大型语言模型（比如 DeepSeek）的训练阶段，整个过程就是一个巨大的学习循环。模型的目标是学习所有参数，包括那些将输入文本转化为 Q、K、V 的权重矩阵，以及最终能生成有意义文本的能力。

---
### 1. 输入和 Embedding 层

这是所有计算的起点。

* **原始输入**: 你提供给模型的是人类可读的文本，比如“我爱北京”。
* **分词 (Tokenization)**: 首先，这些文本会被一个叫做**分词器 (Tokenizer)** 的工具处理。分词器将连续的文本分解成一个个独立的**词元 (Token)**。例如，“我爱北京”可能被分成 `["我", "爱", "北京"]`。每个 Token 都会被赋予一个唯一的数字 ID。
* **Embedding 层**: 接下来，这些数字 ID 会被送入模型的**Embedding 层**。
    * **初始状态**: 在训练刚开始时，Embedding 层里的每个 Token 对应的向量（也就是它的 **Embedding 向量**）都是**随机初始化**的。你可以把它想象成一个巨大的查找表，每个 Token ID 对应一行随机数字。
    * **学习过程**: 这个 Embedding 层是模型**可学习的参数**之一。在整个训练过程中，这些随机初始化的 Embedding 向量会不断地被**调整和优化**。模型通过处理海量的文本数据，逐渐学会为每个 Token 找到一个能最好地表示其语义、语法和上下文关系的数值向量。例如，经过充分训练后，“猫”的 Embedding 向量在数学空间中会变得与“狗”的 Embedding 向量更接近，而与“汽车”的 Embedding 向量距离较远。

    经过 Embedding 层处理后，我们的输入文本就变成了一个由 Embedding 向量组成的序列。如果输入有 $L$ 个 Token，每个 Embedding 向量的维度是 $d_{model}$，那么这个输入序列就形成了一个形状为 $L \times d_{model}$ 的矩阵 $X$。

---
### 2. QKV 权重矩阵的初始化与学习

在 Transformer 模型的注意力机制内部，我们需要三个特殊的权重矩阵来生成 Q、K、V：

* **$W_Q$ (Query Weight Matrix)**
* **$W_K$ (Key Weight Matrix)**
* **$W_V$ (Value Weight Matrix)**

* **初始状态**: 和 Embedding 层一样，在训练开始时，这些 $W_Q, W_K, W_V$ 矩阵的数值也是**随机初始化**的。它们的形状取决于模型的维度设计，例如，如果 $d_{model}$ 是 1024，QKV 的内部维度 $d_k$ 和 $d_v$ 是 64，那么 $W_Q, W_K$ 的形状可能是 $1024 \times 64$，而 $W_V$ 的形状可能是 $1024 \times 64$。
* **学习过程**: 这三个权重矩阵也是模型在训练过程中需要**学习和调整的关键参数**。它们决定了如何将输入的 Embedding 向量转换为用于注意力计算的 Q、K、V 向量。

---
### 3. QKV 矩阵的计算（前向传播）

在训练的每一次迭代中（即处理一个批次的数据时）：

1.  模型接收经过 Embedding 层转换后的输入序列矩阵 $X$（形状 $L \times d_{model}$）。
2.  它将 $X$ 分别与当前学习到的 $W_Q, W_K, W_V$ 矩阵进行**矩阵乘法（线性变换）**，生成对应的 Q、K、V 矩阵。

    * **计算 Q**: $Q = X W_Q$
    * **计算 K**: $K = X W_K$
    * **计算 V**: $V = X W_V$

    这样，我们就得到了一个批次中所有 Token 对应的 Query、Key 和 Value 矩阵。例如，如果 $X$ 的形状是 $L \times d_{model}$，$W_Q$ 是 $d_{model} \times d_k$，那么 $Q$ 的形状就是 $L \times d_k$。K 和 V 同理。

---
### 4. 注意力计算与模型输出

* 生成 Q、K、V 之后，它们会被送入**缩放点积注意力**的公式进行计算，得到注意力输出（你之前看到的公式 $\text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$）。
* 这个注意力输出会经过模型后续的其他层（例如多头注意力、前馈网络等）。
* 最终，模型会根据这些计算结果，预测出它认为应该产生的输出（比如下一个词的概率分布）。

---
### 5. 损失计算与参数更新（反向传播）

* **计算损失**: 模型会将预测输出与真实的“正确答案”（即训练数据中的实际目标）进行比较，计算出一个**损失值**。这个损失值衡量了模型预测的“错误”程度。
* **反向传播**: 损失值会通过**反向传播**算法，逐层向后计算每个参数（包括 Embedding 层中的 Embedding 向量，$W_Q, W_K, W_V$ 以及模型其他层的权重）的**梯度**。梯度指明了如何调整参数才能使损失减小。
* **优化器更新**: 一个叫做**优化器 (Optimizer)** 的算法（如 AdamW）会根据这些梯度来**更新**所有的模型参数，包括：
    * **Embedding 向量**: 调整每个 Token 的 Embedding 向量，使其更好地捕捉语义。
    * **$W_Q, W_K, W_V$ 矩阵**: 调整这些权重矩阵，使得 Q、K、V 的生成方式能够更有效地帮助模型理解输入和输出之间的关系。

这个“前向传播 -> 计算损失 -> 反向传播 -> 更新参数”的循环会**重复数百万次甚至更多**，直到模型的损失达到可接受的水平，或者不再显著下降。在这个漫长的过程中，Embedding 向量和 QKV 的权重矩阵（以及模型的所有其他参数）会从最初的随机状态，逐渐学习到能够执行复杂任务（如生成流畅、有逻辑的文本）的能力。

## Python 模拟推理过程注意力机制计算过程

模拟模型一步步生成“我 爱 北京”这个短语的过程。

### 推理过程中的 QKV 与 KV Cache 模拟

假设模型已经**训练完毕**，所以：

1.  **Embedding 权重**是固定的，不再更新。
2.  **QKV 权重矩阵 ($W\_Q, W\_K, W\_V$)** 也是固定的，不再更新。
3.  我们将引入 **KV Cache** 来存储已经计算过的 Key 和 Value 向量。

> 需要计算过的 Key 和 Value 向量是因为预测生成的词也要放到注意力机制中去考虑。
-----

之前的模拟确实更侧重于模型内部的生成机制，而没有明确地把**用户的初始问题或提示输入**也整合进去。

在实际的大模型推理中，用户输入的提示词（prompt）是整个生成过程的**起点**。模型首先会处理这个提示词，理解用户的意图，然后才开始生成回应。

让我们修改模拟，把**用户提示词的输入和处理**明确地加进来。

-----

## Python 模拟 Transformer 模型推理（带用户输入与 KV Cache）

这次的模拟将更加完整：

1.  **用户输入提示词（Prompt）**：这是生成过程的开始。
2.  **提示词处理阶段（Pre-fill）**：模型一次性计算整个提示词序列的 KV，填充 KV Cache。
3.  **逐 Token 生成阶段（Decoding）**：模型根据填充好的 KV Cache，逐个生成响应 Token。

<!-- end list -->

```python
import numpy as np

# --- 1. 定义模拟参数和固定“训练好”的权重 ---
# 词汇表：包括特殊标记，用于序列开始和结束
vocab = {"<PAD>": 0, "我": 1, "爱": 2, "北京": 3, "你": 6, "好": 7, "世界": 8, "<SOS>": 4, "<EOS>": 5}
id_to_token = {v: k for k, v in vocab.items()}

# 模型维度设置
d_model = 8       # Embedding 维度
d_k = 4           # Query 和 Key 向量维度
d_v = 4           # Value 向量维度

# 模拟训练好的固定 Embedding 权重
# 每一行是一个 Token 的 Embedding 向量
# （实际中这些值是模型学习到的，这里为演示手动设置一些可区分的数值）
fixed_embedding_weights = np.array([
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], # <PAD> (0)
    [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2], # 我 (1)
    [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9], # 爱 (2)
    [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1], # 北京 (3)
    [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75], # <SOS> (4)
    [0.95, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25], # <EOS> (5)
    [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.1], # 你 (6)
    [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.1, 0.2], # 好 (7)
    [0.5, 0.6, 0.7, 0.8, 0.9, 0.1, 0.2, 0.3], # 世界 (8)
])

# 模拟训练好的固定 Q, K, V 权重矩阵
# 这些矩阵将 Embedding 转换为 Q, K, V
fixed_W_Q = np.array([
    [0.1, 0.2, 0.0, 0.1], [0.0, 0.1, 0.2, 0.0],
    [0.2, 0.0, 0.1, 0.2], [0.1, 0.2, 0.0, 0.1],
    [0.0, 0.1, 0.2, 0.0], [0.2, 0.0, 0.1, 0.2],
    [0.1, 0.2, 0.0, 0.1], [0.0, 0.1, 0.2, 0.0],
])
fixed_W_K = np.array([
    [0.0, 0.1, 0.2, 0.0], [0.1, 0.0, 0.1, 0.2],
    [0.2, 0.1, 0.0, 0.1], [0.0, 0.1, 0.2, 0.0],
    [0.1, 0.0, 0.1, 0.2], [0.2, 0.1, 0.0, 0.1],
    [0.0, 0.1, 0.2, 0.0], [0.1, 0.0, 0.1, 0.2],
])
fixed_W_V = np.array([
    [0.2, 0.1, 0.0, 0.2], [0.1, 0.2, 0.1, 0.0],
    [0.0, 0.1, 0.2, 0.1], [0.2, 0.1, 0.0, 0.2],
    [0.1, 0.2, 0.1, 0.0], [0.0, 0.1, 0.2, 0.1],
    [0.2, 0.1, 0.0, 0.2], [0.1, 0.2, 0.1, 0.0],
])

# --- 2. 核心注意力函数 ---
def calculate_attention(Q_current, K_cache, V_cache):
    """
    计算缩放点积注意力。
    Q_current: 当前步的 Query (形状 1 x d_k)
    K_cache: 累积的 Key 缓存 (形状 L_current x d_k)
    V_cache: 累积的 Value 缓存 (形状 L_current x d_v)
    返回: 注意力输出向量 (形状 1 x d_v), 注意力权重 (形状 1 x L_current)
    """
    # 1. 打分: 计算 Q_current 与 K_cache 的点积相似度
    # (1 x d_k) @ (d_k x L_current) -> (1 x L_current)
    scores = np.dot(Q_current, K_cache.T)

    # 2. 缩放: 防止数值过大导致 Softmax 梯度消失
    scaled_scores = scores / np.sqrt(d_k)

    # 3. 归一化: Softmax 得到注意力权重 (0到1之间，和为1)
    attention_weights = np.exp(scaled_scores - np.max(scaled_scores)) / np.sum(np.exp(scaled_scores - np.max(scaled_scores)), axis=-1, keepdims=True)

    # 4. 求和: 用注意力权重对 V_cache 进行加权求和
    # (1 x L_current) @ (L_current x d_v) -> (1 x d_v)
    attention_output = np.dot(attention_weights, V_cache)

    return attention_output, attention_weights

# --- 3. 推理生成模拟主流程 ---

def generate_text_with_kv_cache(user_prompt_text, max_new_tokens=5, mock_predicted_tokens=None):
    """
    模拟Transformer模型文本生成过程，带用户提示词输入和KV Cache。

    user_prompt_text: 用户的输入提示词字符串。
    max_new_tokens: 最多生成多少个新 Token。
    mock_predicted_tokens: (仅用于演示) 预设的模型预测结果列表，模拟模型生成。
                           如果为 None，则默认在生成max_new_tokens后生成<EOS>。
    """
    # 1. 将用户提示词转换为 Token IDs
    # 实际模型中，会有一个复杂的Tokenizer，这里简单地按空格分词并查找ID
    prompt_tokens = user_prompt_text.split()
    # 加上 <SOS> 作为序列的真正开始
    prompt_ids = [vocab["<SOS>"]] + [vocab.get(token, vocab["<PAD>"]) for token in prompt_tokens]

    generated_ids = list(prompt_ids) # 包含 <SOS> 和用户提示词
    output_text_tokens = [id_to_token[idx] for idx in generated_ids]

    # KV Cache 初始化为空
    kv_cache_K = np.empty((0, d_k))
    kv_cache_V = np.empty((0, d_v))

    print("=" * 60)
    print("--- 文本生成模拟开始 ---")
    print(f"用户提示词: '{user_prompt_text}'")
    print(f"初始模型输入 (Token IDs): {generated_ids} -> {' '.join(output_text_tokens)}")
    print("-" * 60)

    # --- 阶段 1: 处理初始提示词 (Prompt Processing / Pre-fill) ---
    # 这时模型会一次性计算整个提示词序列的K和V，并填充KV Cache。
    # 这一步是并行的，非常高效。
    print("\n[阶段 1] 处理用户提示词并填充 KV Cache...")
    # 获取整个提示词序列的 Embedding 矩阵 (L_prompt x d_model)
    prompt_embeddings = fixed_embedding_weights[prompt_ids]

    # 计算整个提示词序列的 K 和 V 矩阵
    # K_prompt = (L_prompt x d_model) @ (d_model x d_k) = (L_prompt x d_k)
    K_prompt = np.dot(prompt_embeddings, fixed_W_K)
    V_prompt = np.dot(prompt_embeddings, fixed_W_V)

    # 将提示词的 K 和 V 填充到 KV Cache
    kv_cache_K = np.vstack((kv_cache_K, K_prompt))
    kv_cache_V = np.vstack((kv_cache_V, V_prompt))

    print(f"  用户提示词处理完成。KV Cache 形状：K {kv_cache_K.shape}, V {kv_cache_V.shape}")
    print("-" * 60)

    # --- 阶段 2: 逐个 Token 生成 (Decoding) ---
    print("\n[阶段 2] 逐个 Token 生成模型回应...")
    for step in range(max_new_tokens):
        print(f"\n--- 第 {step + 1} 步：生成回应的下一个 Token ---")

        # 当前用于预测的 Token 总是整个序列的最后一个 Token。
        # 在这里，它要么是用户提示词的最后一个 Token，要么是模型上一步生成的新 Token。
        current_token_for_prediction_id = generated_ids[-1]
        current_token_for_prediction_text = id_to_token[current_token_for_prediction_id]
        print(f"  模型基于当前上下文的最后一个 Token '{current_token_for_prediction_text}' (ID: {current_token_for_prediction_id}) 进行预测。")

        # 3.1 获取当前预测 Token 的 Embedding
        # 形状 (1, d_model)
        current_token_embedding = fixed_embedding_weights[current_token_for_prediction_id].reshape(1, -1)
        print(f"  获取其 Embedding (形状: {current_token_embedding.shape})")

        # 3.2 **仅计算当前 Token 的 Query**
        # 形状 (1, d_k)
        Q_current = np.dot(current_token_embedding, fixed_W_Q)
        print(f"  计算其 Query Q (形状: {Q_current.shape})")

        # 3.3 计算注意力 (使用当前 Q 和 完整的 KV Cache)
        # 注意力的 K 和 V 来自于 KV Cache，包含了所有用户提示词和模型已生成的历史 Token 的信息
        attention_output, attention_weights = calculate_attention(Q_current, kv_cache_K, kv_cache_V)

        # 打印注意力权重，可以看到模型如何“关注”历史上下文
        print(f"  注意力权重 (关注整个历史序列，长度 {attention_weights.shape[1]}): {attention_weights[0].round(3)}")
        print(f"  注意力输出 (形状 {attention_output.shape}): {attention_output.sum(axis=1).round(3)}")

        # 3.4 模拟模型预测下一个 Token
        # 实际模型会根据 attention_output 和其他层（如前馈网络）的输出，
        # 预测下一个词的概率分布，然后进行采样或贪婪选择。
        if mock_predicted_tokens and step < len(mock_predicted_tokens):
            next_token_id = mock_predicted_tokens[step]
        else:
            # 如果没有预设预测，或者达到预设长度，就预测 <EOS>
            next_token_id = vocab["<EOS>"]

        next_token_text = id_to_token[next_token_id]
        print(f"  模型预测下一个 Token: '{next_token_text}'")

        # 3.5 停止条件检查
        if next_token_id == vocab["<EOS>"]:
            print(f"  遇到 <EOS> Token，生成结束。")
            break

        # 3.6 将新生成的 Token 添加到序列中 (作为新的上下文)
        generated_ids.append(next_token_id)
        output_text_tokens.append(next_token_text)

        # 3.7 **计算新生成 Token 的 K 和 V，并更新 KV Cache**
        # 针对刚刚预测出的 next_token_id，计算它的 K 和 V
        next_token_embedding = fixed_embedding_weights[next_token_id].reshape(1, -1)
        K_next_token = np.dot(next_token_embedding, fixed_W_K)
        V_next_token = np.dot(next_token_embedding, fixed_W_V)

        kv_cache_K = np.vstack((kv_cache_K, K_next_token))
        kv_cache_V = np.vstack((kv_cache_V, V_next_token))
        print(f"  将新 Token '{next_token_text}' 的 K/V 添加到缓存。")
        print(f"  KV Cache 形状更新为：K {kv_cache_K.shape}, V {kv_cache_V.shape}")

        print(f"  当前完整序列 (用于下一次预测): {' '.join(output_text_tokens)}")
        print("-" * 60)

    print("\n--- 文本生成完成 ---")
    # 过滤掉 <SOS> 标记，只显示用户输入和模型回应
    final_output_text = " ".join(output_text_tokens[1:]) # 跳过 <SOS>
    print(f"最终生成序列: {final_output_text}")
    print("=" * 60)

# --- 运行模拟 ---
# 模拟用户输入一个问题
user_input = "你 好 世界"
# 模拟模型希望生成的回应：“我 爱 北京”
mock_model_response_tokens = [vocab["我"], vocab["爱"], vocab["北京"], vocab["<EOS>"]]

generate_text_with_kv_cache(
    user_prompt_text=user_input,
    max_new_tokens=5, # 允许生成最多5个Token (包括可能的<EOS>)
    mock_predicted_tokens=mock_model_response_tokens
)

print("\n\n尝试另一个例子：")
generate_text_with_kv_cache(
    user_prompt_text="我 爱",
    max_new_tokens=2,
    mock_predicted_tokens=[vocab["你"], vocab["<EOS>"]] # 模拟生成“你”然后结束
)
```

-----

### 主要改动和重点：

1.  **用户提示词的引入**:

      * `user_prompt_text` 参数直接接收一个字符串，模拟用户的输入。
      * 在函数内部，这个字符串首先被**分词**（这里简化为按空格分割），然后转换为对应的 **Token ID 列表**。
      * 我们还加入了 `<SOS>` (Start of Sequence) Token，这在许多实际模型中作为整个输入序列的开始标记，它也会成为 KV Cache 的一部分。

2.  **阶段 1: 提示词处理 (Pre-fill)**:

      * **明确指出**这个阶段是对整个用户提示词序列（包括 `<SOS>`）进行处理。
      * `prompt_embeddings = fixed_embedding_weights[prompt_ids]` 一次性获取所有提示词 Token 的 Embedding。
      * 然后，`K_prompt` 和 `V_prompt` 是**整个提示词序列**的 K 和 V 矩阵，它们被一次性计算并 `vstack` 到 KV Cache 中。

3.  **阶段 2: 逐 Token 生成 (Decoding)**:

      * 这个阶段开始后，模型就会基于已经填充好的 KV Cache **逐个生成**回应 Token。
      * `current_token_for_prediction_id = generated_ids[-1]` 明确表示，**每次预测的依据都是当前序列的最后一个 Token**。
      * **第一次生成时**，这个“当前 Token”就是**用户提示词的最后一个 Token**（或者如果提示词为空，就是 `<SOS>`）。
      * **后续每次生成**，这个“当前 Token”就是**模型在上一步刚刚预测出的新 Token**。


在实际的 Transformer 模型中，这个过程会更加复杂，会涉及到多个注意力头（Multi-Head Attention）以及更复杂的计算，但基本原理是相通的。

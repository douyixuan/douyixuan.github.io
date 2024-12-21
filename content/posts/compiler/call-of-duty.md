---
title:     'Call of Duty'
date:      2024-04-25T09:55:49+08:00
author:    Cedric
draft:     true
summary:   read more
categories:
tags:
- compiler
---
## What to do with the legacy code？

新语言层出不穷，以前老代码重写很不现实。

## Some ideas and project

### Oracle GraalVM

#### 激进的AOT编译

把动态语言静态编译成二进制，显著提升性能。

#### JIT 作为服务

把 JIT 编译器变成动态库，成为语言的运行时服务。JIT 服务和应用程序分离，单独伸缩部署。

### MirageOS

把通用的操作系统专用化，精简运行抽象层。

把操作系统变成动态库，成为应用程序的运行时。

## What's more

### 编译器 as a service

应用服务

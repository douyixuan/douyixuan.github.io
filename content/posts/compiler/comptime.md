---
title:     'Comptime'
date:      2025-01-19T15:36:51+08:00
author:    Cedric
draft:     false
summary:   read more
categories:
tags:
- zig
---

[Zig's Comptime is Bonkers Good](https://www.scottredig.com/blog/bonkers_comptime/?ref=dailydev)

> 探讨了 Zig 编程语言的强大编译期特性 `comptime`,它允许开发者在编译期执行复杂的数据操作和代码生成,从而提高程序的性能和可读性。

关键要点
- `comptime` 可以让开发者忽略代码的编译/运行时区分,专注于程序的整体行为。
- `comptime` 提供了一种类似"泛型编程"的功能,允许开发者定义通用的数据结构和函数。
- `comptime` 可以用来预先计算并生成固定的输出,从而提高程序的运行效率。
- `comptime` 的实现原理是编译器先解析代码语法,然后运行一个虚拟机来执行编译期计算,最后生成运行时的机器码。
- `comptime` 支持一些特殊的语法和函数,如 `@embedFile` 等,方便开发者进行代码生成。

### Zig Comptime 示例

#### **Zig 示例**
```zig
const std = @import("std");

pub fn sumFields(my_struct: MyStruct) i64 {
    var sum: i64 = 0;
    inline for (comptime std.meta.fieldNames(MyStruct)) |field_name| {
        sum += @field(my_struct, field_name);
    }
    return sum;
}

const MyStruct = struct {
    a: i64,
    b: i64,
    c: i64,
};

pub fn main() void {
    const my_struct = MyStruct{ .a = 1, .b = 2, .c = 3 };
    const result = sumFields(my_struct);
    std.debug.print("Struct's sum is {d}.\n", .{result});
}
```

[execute here](https://godbolt.org/z/7v3G68b55)

### 总结
Zig 利用 `comptime` 特性来提高代码的性能和可读性.

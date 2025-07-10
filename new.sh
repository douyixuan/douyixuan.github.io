

# 显示帮助信息
show_help() {
    echo "用法: $0 <分类> [文件名]"
    echo ""
    echo "参数:"
    echo "  分类    必需参数，指定文章分类"
    echo "  文件名  可选参数，指定文件名（默认为分类名）"
    echo ""
    echo "示例:"
    echo "  $0 tech                    # 创建 tech/tech.md"
    echo "  $0 tech my-article         # 创建 tech/my-article.md"
    echo ""
    echo "选项:"
    echo "  -h, --help, help    显示此帮助信息"
}

# 检查是否需要显示帮助
if [ $# -eq 0 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ] || [ "$1" = "help" ]; then
    show_help
    exit 0
fi

catogory=$1
filename=$1
if [ -z "$2" ]; then
    echo "new post: $filename"
else
    filename=$2
fi
set -x
hugo new content posts/$catogory/$filename.md

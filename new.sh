set -x
catogory=$1
filename=$1
if [ -z "$2" ]; then
    echo
else
    filename=$2
fi
hugo new content posts/$catogory/$filename.md

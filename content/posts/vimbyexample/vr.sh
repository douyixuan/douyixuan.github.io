#/bin/bash

# vr for vim run
# vim -e '+redir >> /dev/stdout' -S $1 '+q'

# output multiple lines, there is an empty line at the beginning
rm -f output && vim -e '+redir >> output' -S $1 '+redir END' '+q' && cat output

# TODO redirect stderr
# silent echo "hi" 2&>1 | " passed
# cmd="silent !source $1 2>&1"
# echo $cmd
# rm -f output && vim -e -c $cmd '+q'

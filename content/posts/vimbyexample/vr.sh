#/bin/bash

# vr for vim run
# vim -e '+redir >> /dev/stdout' -S $1 '+q'

# output multiple lines, there is an empty line at the beginning
rm -f output && vim -e '+redir >> output' -S $1 '+redir END' '+q' && cat output

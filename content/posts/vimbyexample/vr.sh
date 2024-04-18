#/bin/bash

# vr for vim run
vim -e '+redir >> /dev/stdout' -S $1 '+q'

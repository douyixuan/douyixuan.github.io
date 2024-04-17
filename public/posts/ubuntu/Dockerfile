FROM ubuntu:jammy

# setup a develpment env
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get install -y git && \
    apt-get install -y zsh && \
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" -y && \
    apt-get install -y vim && \
    apt-get install -y make && \
    apt-get install -y gcc && \
    apt-get install -y ncurses-dev && \
    apt-get install -y expect && \
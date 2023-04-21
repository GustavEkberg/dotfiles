#!/bin/bash

OS=$(uname -s)

# If OS X
if [ $OS = 'Linux' ]
then
  echo "Installing Linux (Debian) packages"
  apt-get update
  apt-get upgrade
  apt-get install fish prettyping tmux pkg-config libssl-dev git tmux_mem_cpu_load 
else
  echo "Installing OSX packages"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  brew install --cask 1password/tap/1password-cli
  brew install neovim tmux lazygit fish prettyping git tmux_mem_cpu_load 
fi

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install exa zoxide bat starship ripgrep

cd
mkdir code
cd code
git clone https://github.com/GustavEkberg/dotfiles
cd dotfiles

starship init fish | source
fish_vi_key_bindings

source $HOME/.config/fish/connections.sh

alias vim='nvim'
alias vi='nvim'
alias v='nvim'
alias vv='nvim .'
alias ll='ls -lah'
alias wttr='curl wttr.in/Gothenburg'
alias nn='cd /Users/abraxas/Dropbox/Notes/kkdvr && vim'
alias python='python3'

set -x PATH $PATH $HOME/.cargo/bin
set -x PATH $PATH /opt/homebrew/bin
set -gx PATH (yarn global bin) $PATH

set -Ux PYENV_ROOT $HOME/.pyenv
fish_add_path $PYENV_ROOT/bin

set -x EDITOR /opt/homebrew/bin/nvim

if type -q prettyping
  alias ping='prettyping'
end

if type -q exa
    alias ls='exa -G  --color auto --icons -a -s type'
    alias ll='exa -l --color always --icons -a -s type'
    alias lln='exa -l --color always --icons -a -s type -snew'
end

if type -q bat
    alias cat=bat
end

if type -q zoxide
    zoxide init fish | source
    alias cd='z'
end

# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH

pyenv init - | source

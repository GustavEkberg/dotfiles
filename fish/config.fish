fish_vi_key_bindings

if test -f $HOME/.config/fish/connections.sh
    source $HOME/.config/fish/connections.sh
end
set -g fish_greeting
set -x LANG en_US.UTF-8

alias o='opencode'
alias oc='opencode --continue'
alias vim='nvim'
alias vi='nvim'
alias v='nvim'
alias vv='nvim .'
alias ll='ls -lah'
alias wttr='curl wttr.in/Gothenburg'
alias nn='cd /Users/abraxas/Dropbox/Notes/kkdvr && vim'
alias python='python3'
alias yd='pnpm dev'
alias yi='yarn install'
alias tt='tmux attach -t vim || tmux new -s vim' 
alias tp='tmux attach -t primary || tmux new -s primary' 
alias o='opencode'

function cpcp
    cat $argv | pbcopy
end



set -x PATH $PATH $HOME/.cargo/bin
set -x PATH $PATH /opt/homebrew/bin

# Only add yarn global bin to PATH if it exists and returns a valid path
if type -q yarn
    set -l yarn_bin (yarn global bin 2>/dev/null)
    if test -d "$yarn_bin"
        set -gx PATH $yarn_bin $PATH
    end
end

set -Ux PYENV_ROOT $HOME/.pyenv
fish_add_path $PYENV_ROOT/bin

set -x EDITOR /opt/homebrew/bin/nvim
set -x SAM_CLI_TELEMETRY 0

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
    alias ccat='bat -pp'
end

if type -q zoxide
    zoxide init fish | source
    alias cd='z'
end

# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH

pyenv init - | source
starship init fish | source

# pnpm
set -gx PNPM_HOME "/Users/abraxas/Library/pnpm"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end
# pnpm end

---
name: hf-cli
description: Hugging Face Hub CLI (`hf`) usage for models, datasets, Spaces, repos, buckets, jobs, endpoints, papers, cache, auth, and skills. Use when the user mentions Hugging Face, huggingface, hf, huggingface-cli, Hub models/datasets/Spaces, HF Jobs, Inference Endpoints, or needs ML assets managed through the Hugging Face ecosystem.
---

# Hugging Face CLI

Use the `hf` CLI to work with the Hugging Face Hub from agents. It replaces deprecated `huggingface-cli`.

## First Checks

```bash
command -v hf
hf version
hf --help
```

If missing, install from the official script:

```bash
curl -LsSf https://hf.co/cli/install.sh | bash -s
```

If a command or flag is missing, update first:

```bash
hf update
```

The installed CLI version determines available commands. Always prefer `hf <group> --help` or `hf <group> <command> --help` over assuming exact flags.

## Safety

- Prefer `--format json` for machine-readable output when available.
- Prefer `HF_TOKEN` env var over passing `--token` on the command line.
- Never print `hf auth token` unless the user explicitly asks for token debugging.
- Ask before destructive operations: repo delete, bucket delete/remove, endpoint delete, webhook delete, secrets delete, cache prune/rm without `--dry-run`.
- Use `--dry-run` first for syncs, uploads, deletes, and cache cleanup when supported.

## Auth

```bash
hf auth whoami
hf auth login
hf auth list
hf auth switch --token-name NAME
hf auth logout --token-name NAME
```

Tokens live at https://huggingface.co/settings/tokens.

## Common Workflows

### Search Or Inspect Models

```bash
hf models list --search "text-generation" --limit 20 --format json
hf models info openai-community/gpt2 --format json
hf models card openai-community/gpt2 --text
```

### Download Models Or Datasets

```bash
hf download openai-community/gpt2 --local-dir ./models/gpt2
hf download squad --type dataset --local-dir ./data/squad
hf download REPO_ID --include "*.safetensors" --exclude "*.bin"
```

### Upload To A Repo

```bash
hf upload USER_OR_ORG/REPO ./local-file.txt path/in/repo.txt --type model --create-pr
hf upload USER_OR_ORG/DATASET ./data . --type dataset --private --commit-message "update dataset"
hf upload-large-folder USER_OR_ORG/REPO ./large-folder --type model
```

### Manage Repos

```bash
hf repos create USER_OR_ORG/REPO --type model --private
hf repos list --namespace USER_OR_ORG --type model --format json
hf repos settings USER_OR_ORG/REPO --type model --private
hf repos branch create USER_OR_ORG/REPO BRANCH --type model
hf repos tag list USER_OR_ORG/REPO --type model
```

### Work With Datasets

```bash
hf datasets list --search "benchmark" --limit 20 --format json
hf datasets info DATASET_ID --format json
hf datasets card DATASET_ID --text
hf datasets parquet DATASET_ID --subset SUBSET --split train --format json
hf datasets sql "SELECT * FROM 'hf://datasets/USER/DATA/**/*.parquet' LIMIT 10"
```

### Manage Spaces

```bash
hf spaces list --search "gradio" --limit 20 --format json
hf spaces info USER_OR_ORG/SPACE --format json
hf spaces logs USER_OR_ORG/SPACE --tail 100
hf spaces restart USER_OR_ORG/SPACE
hf spaces hardware
hf spaces settings USER_OR_ORG/SPACE --hardware t4-small
hf spaces secrets list USER_OR_ORG/SPACE --format json
hf spaces secrets add USER_OR_ORG/SPACE --secrets KEY=VALUE
hf spaces variables add USER_OR_ORG/SPACE --env KEY=VALUE
```

### Run HF Jobs

```bash
hf jobs hardware
hf jobs run python:3.12 "python -c 'print(123)'" --flavor cpu-basic --detach
hf jobs ps --all --format json
hf jobs inspect JOB_ID --format json
hf jobs logs JOB_ID --tail 100
hf jobs wait JOB_ID
hf jobs cancel JOB_ID
```

For Python scripts with dependencies:

```bash
hf jobs uv run ./script.py --with pandas --python 3.12 --flavor cpu-basic --detach
```

### Buckets And Sync

```bash
hf buckets create USER_OR_ORG/BUCKET --private --region us
hf buckets list USER_OR_ORG/BUCKET --recursive --format json
hf buckets cp ./file.txt hf://USER_OR_ORG/BUCKET/path/file.txt
hf buckets sync ./local-dir hf://USER_OR_ORG/BUCKET/path --dry-run
hf buckets sync ./local-dir hf://USER_OR_ORG/BUCKET/path --apply PLAN_ID
```

### Inference Endpoints

```bash
hf endpoints list --format json
hf endpoints describe ENDPOINT_NAME --format json
hf endpoints catalog list --format json
hf endpoints deploy ENDPOINT_NAME --repo USER_OR_ORG/MODEL --framework pytorch --accelerator cpu --instance-size x1 --instance-type intel-icl --region us-east-1 --vendor aws
hf endpoints pause ENDPOINT_NAME
hf endpoints resume ENDPOINT_NAME
hf endpoints scale-to-zero ENDPOINT_NAME
```

### Discussions And Pull Requests

```bash
hf discussions list USER_OR_ORG/REPO --type model --status open --format json
hf discussions info USER_OR_ORG/REPO 1 --type model --format json
hf discussions diff USER_OR_ORG/REPO 1 --type model
hf discussions comment USER_OR_ORG/REPO 1 --type model --body "Looks good"
hf discussions create USER_OR_ORG/REPO --type model --title "Update" --body-file ./body.md --pull-request
```

### Papers And Collections

```bash
hf papers search "diffusion transformers" --limit 10 --format json
hf papers read 2401.00001
hf collections list --owner USER_OR_ORG --format json
hf collections create "My Collection" --namespace USER_OR_ORG --private
hf collections add-item COLLECTION_SLUG ITEM_ID model
```

### Cache

```bash
hf cache list --limit 50 --format json
hf cache verify REPO_ID --type model
hf cache prune --dry-run
hf cache rm REPO_ID --dry-run
```

## Other Command Families

Also check `hf webhooks --help`, `hf skills --help`, `hf extensions --help`, and `hf jobs scheduled --help` when tasks involve webhooks, skill updates, CLI extensions, or scheduled compute.

## Skill Maintenance

This skill is based on Hugging Face's generated `hf-cli` skill and docs at https://huggingface.co/docs/hub/agents-cli.

To refresh from the installed CLI:

```bash
hf skills add --dest opencode/skill --force
```

Restart OpenCode after changing skill files; skills are loaded at startup.

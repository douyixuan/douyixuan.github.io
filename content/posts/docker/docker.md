---
title:     'Docker Desktop Alternative'
date:      2024-12-21T23:11:08+08:00
author:    Cedric
draft:     false
summary:   read more
categories:
tags:
- docker
---

[Docker on MacOS is still slow?](https://www.paolomainardi.com/posts/docker-performance-macos-2025/?ref=dailydev)

We have new solutions in the docker ecosystem. `Lima` (open-source) performs well and sometimes better than Docker Desktop, while Docker’s new file synchronization feature offers impressive speed improvements (59% faster) but requires a paid subscription. Additionally, `OrbStack` has emerged as a strong contender, offering excellent performance with bind mounts and native operations. For the most stable performance, the hybrid approach (combining bind mounts with volumes) remains the best practice. Choose your setup based on your needs:

- Fast, stable, and open-source: Go with Lima.
- Maximum speed: Use Docker Desktop with file synchronization or OrbStack.
- Stable performance: Use the hybrid approach with volumes with any solution.

### Orbstack

After install with `brew install orbstack`

#### Data migration

After installation, OrbStack will offer to migrate your Docker Desktop data automatically, including containers, volumes, images, and more. This is optional and you can always migrate later from File > Migrate Docker Data, or from the command line:

```
orb migrate docker
```

This makes a copy of your old data, so feel free to reset data in Docker Desktop if everything went well.

#### Use orb and docker Side-by-side

You can use Docker contexts to run OrbStack and Docker Desktop side-by-side. Switching contexts affects all commands you run from that point on:

Switch to OrbStack

```
docker context use orbstack
```

Switch to Docker Desktop

```
docker context use desktop-linux
```

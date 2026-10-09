---
title: 从零搭建一台自用 VPS 节点
description: 如果一个人要网上冲浪，他会怎么做？
published: 2026-10-09
category: 学习笔记
tags:
  - vps
  - 自建节点
draft: false
password: linuxdo
passwordHint: 一个知名AI技术网站，小写不含空格
---
# 从零搭建一台自用 VPS 节点：DediRock、VLESS + REALITY 与 Hysteria 2 实录

> 这是一篇根据我的实际操作整理的复现笔记，记录时间为 2026 年 9—10 月。文中的 `<VPS_IP>`、`<UUID>`、`<私钥>`、`<密码>` 等都要换成读者自己的值。命令分为 Mac 本机和 VPS 两种环境；先看清提示符再执行。

## 1. 最终搭成了什么

我购买的是 DediRock 洛杉矶的 **Promo VPS Special LA**。购买时页面显示：2 GB 内存、1 vCore、30 GB SSD、1 个 IPv4、1 Gbps 网口、2 TB 流量，年付 10.88 美元。本文记录的是**当时的订单**，促销库存、价格和规格都可能改变；下单前以 [DediRock 促销产品页](https://billing.dedirock.com/index.php/store/promo-vps-los-angeles)及[客户区](https://billing.dedirock.com/)的当前订单页为准。

服务器运行 Debian 13。我们先完成 SSH 密钥登录、防火墙和自动安全更新，再部署了两条可独立选择的节点（我个人最后使用的是HY2的节点，如果要搭建的话可以略过第7部分VLESS + REALITY节点的搭建过程）：

| 节点           | 服务端软件                         | 入口      | 分享给客户端的格式         |
| ------------ | ----------------------------- | ------- | ----------------- |
| DediRock-LA  | Xray：VLESS + REALITY + Vision | TCP 443 | `vless://...`     |
| DediRock-HY2 | Hysteria 2                    | UDP 443 | `hysteria2://...` |

同一台机器可以同时使用 TCP 443 和 UDP 443，因为它们是不同的传输协议。Xray 和 Hysteria 由 systemd 在 VPS 后台运行，**关闭 Mac 终端或关闭 Mac 不会停止 VPS**；只有 VPS 关机、服务停止或网络出问题时节点才会不可用。两条节点最终都导入了 Shadowrocket。

## 2. 准备和识别两个终端

需要一台可 SSH 的电脑、已开通的 VPS、从服务商获取的公网 IPv4 和初始 root 密码。本文示例的普通管理员账号叫 `vpsadmin`。在 Mac 终端，提示符通常像 `jayzhu@Mac ~ %`；登录 VPS 后是 `vpsadmin@主机名:~$`。**所有带 `sudo` 的服务端命令都在 VPS 上运行，不能误在 Mac 上运行。**

控制面板中的主机名只是机器名，不一定已经有公开 DNS 记录。我们当时点击类似 `dedirock-数字` 的名字，浏览器报 `ERR_NAME_NOT_RESOLVED`，于是改用客户区 **Primary IP** 登录：

```bash
# 在 Mac 终端
ssh root@<VPS_IP>
```

首次登录应核对 SSH 主机指纹；如果服务商给的指纹与本机看到的不一致，先查明原因。root 密码输入时不会显示字符。我们第一次连接曾直接断开，第二次成功；单次断开不足以判断服务器坏了。

## 3. 更新 Debian，重启并确认内核

在 VPS 的 root 会话执行：

```bash
apt update
apt upgrade -y
reboot
```

`apt update` 更新软件包索引，`full-upgrade` 安装升级，`reboot` 让新内核生效。升级时我们看到 `update-initramfs` 生成启动镜像、GRUB 找到新旧内核，随后回到了 shell 提示符；这属于正常完成。`apt update` 期间还出现一次 `Packages.diff/Index` 压缩字节数报错，但 apt 自动重新下载并最终完成，未因此另做修复。重连后用 `uname -r` 验证正在运行的新内核。**不要在升级或生成 initramfs 时强制断电。**

```bash
# 在 Mac 重连
ssh root@<VPS_IP>
# 在 VPS 查看
uname -r
```

## 4. 建立普通管理员账号

继续在 VPS 的 root 会话执行：

```bash
adduser vpsadmin
apt install -y sudo
usermod -aG sudo vpsadmin
```

`adduser` 会提示设置 `vpsadmin` 的登录密码；姓名、电话等字段可以直接回车。然后从 Mac 另开一个终端登录并验证：

```bash
ssh vpsadmin@<VPS_IP>
sudo whoami
```

预期输出是 `root`。这一步确认普通账号可以管理机器，再考虑关闭 root 登录。

## 5. 配置 SSH 密钥，再关闭密码登录

先在 **Mac** 生成独立的 Ed25519 密钥，并给私钥设置口令：

```bash
ssh-keygen -t ed25519 -f ~/.ssh/dedirock_vps -C dedirock-vps
```

`~/.ssh/dedirock_vps` 是**私钥**，只留在自己的设备上并做好安全备份；`~/.ssh/dedirock_vps.pub` 是可以上传到 VPS 的**公钥**。连接时要求输入的“私钥口令”是在本地解锁私钥，并非把服务器登录密码再发给 VPS。密钥指纹是辨认这把密钥的摘要；randomart 是同一指纹的图形化表示。

将公钥追加到 VPS：

```bash
# 在 Mac 终端；如有提示，输入当时 vpsadmin 的登录密码
cat ~/.ssh/dedirock_vps.pub | ssh vpsadmin@<VPS_IP> 'umask 077; mkdir -p "$HOME/.ssh"; cat >> "$HOME/.ssh/authorized_keys"; chmod 700 "$HOME/.ssh"; chmod 600 "$HOME/.ssh/authorized_keys"'
```

**保持原来的 SSH 会话开启**，在 Mac 的另一个终端先测试密钥登录：

```bash
ssh -i ~/.ssh/dedirock_vps -o IdentitiesOnly=yes -o PasswordAuthentication=no vpsadmin@<VPS_IP>
```

确认能登录后，在 VPS 写 SSH 加固配置：

```bash
printf '%s\n' 'PermitRootLogin no' 'PasswordAuthentication no' 'KbdInteractiveAuthentication no' | sudo tee /etc/ssh/sshd_config.d/00-security.conf
sudo /usr/sbin/sshd -t
sudo /usr/sbin/sshd -T | grep -E '^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication) '
sudo systemctl reload ssh
systemctl is-active ssh
```

我们实际看到的生效值是 `permitrootlogin no`、`passwordauthentication no`、`kbdinteractiveauthentication no`、`pubkeyauthentication yes`，服务状态为 `active`。最后再从**新的 Mac 终端**用密钥重连一次，成功后才关闭旧会话。`sshd -T` 比只看配置文件可靠，因为它显示合并后真正生效的值。可参阅 [Debian 的 sshd_config 手册](https://manpages.debian.org/trixie/openssh-server/sshd_config.5.en.html)。

## 6. 设置防火墙和自动更新

在 VPS 上安装 UFW，**先放行 SSH 22/TCP，再启用防火墙**：

```bash
sudo apt install -y ufw
sudo ufw allow 22/tcp
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw enable
sudo ufw status verbose
```

启用时会提醒可能中断 SSH；我们已经预先放行 22/TCP，实际连接保持正常。后面安装节点时再分别开放 443/TCP 和 443/UDP。服务商如果另有“云防火墙”，还要在其控制面板开放对应端口。

接着在 VPS 安装自动更新：

```bash
sudo apt install -y unattended-upgrades
printf '%s\n' \
  'APT::Periodic::Update-Package-Lists "1";' \
  'APT::Periodic::Unattended-Upgrade "1";' \
  'Unattended-Upgrade::Automatic-Reboot "false";' \
  | sudo tee /etc/apt/apt.conf.d/20auto-upgrades
apt-config dump | grep -E '^(APT::Periodic::(Update-Package-Lists|Unattended-Upgrade)|Unattended-Upgrade::Automatic-Reboot)'
```

安装包时 systemd 服务虽已启用，但我们当时运行 `apt-config dump | grep '^APT::Periodic'` 没有输出，所以显式写了每日更新索引、每日安装允许的更新，并禁止自动重启。定期查看 `journalctl -u unattended-upgrades` 和是否需要人工重启。自动更新减少已知漏洞暴露时间，但不等于免维护。

## 7. 第一条节点：Xray 的 VLESS + REALITY

我们采用 [Xray 官方安装器](https://github.com/XTLS/Xray-install)，没有使用来历不明的一键面板。REALITY 的字段可查 [Xray 官方文档](https://xtls.github.io/en/config/transports/reality.html)和[官方服务端示例](https://github.com/XTLS/Xray-examples/blob/main/VLESS-TCP-XTLS-Vision-REALITY/config_server.jsonc)。

在 VPS 下载并安装：

```bash
sudo apt install -y curl unzip
curl -fL https://github.com/XTLS/Xray-install/raw/main/install-release.sh -o ~/xray-install.sh
sudo bash ~/xray-install.sh install
systemctl is-active xray
```

当时安装的是 Xray v26.3.27。官方脚本把程序放在 `/usr/local/bin/xray`，systemd 服务读 `/usr/local/etc/xray/config.json`，以 `nobody` 用户运行。新装完服务是否为 `active` 并不代表节点已经配好；还需要生成凭据和写入自己的配置。

先在 VPS 生成 3 组**各自独立的**值，并暂时只记录在自己的安全位置：

```bash
/usr/local/bin/xray x25519     # 记下 PrivateKey 与 Password/PublicKey
/usr/local/bin/xray uuid       # 记下 UUID
openssl rand -hex 8           # 记下 Short ID
```

用 `sudo nano /usr/local/etc/xray/config.json` 写入下列配置，把尖括号占位符替换掉。这里把未认证的 REALITY 连接送到本机 `4431` 的过滤入口；过滤入口仅把目标确认为 `speed.cloudflare.com` 的流量直连，其余丢弃。这个结构来自我们当时实际运行的脚本，不是随手拼出的通用模板。

```json
{
  "log": { "loglevel": "warning" },
  "inbounds": [
    {
      "tag": "fallback-filter",
      "listen": "127.0.0.1",
      "port": 4431,
      "protocol": "dokodemo-door",
      "settings": { "address": "speed.cloudflare.com", "port": 443, "network": "tcp" },
      "sniffing": { "enabled": true, "destOverride": ["tls"], "routeOnly": true }
    },
    {
      "tag": "private-node",
      "listen": "0.0.0.0",
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [{ "id": "<UUID>", "flow": "xtls-rprx-vision" }],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "target": "127.0.0.1:4431",
          "serverNames": ["speed.cloudflare.com"],
          "privateKey": "<XRAY_PRIVATE_KEY>",
          "shortIds": ["<SHORT_ID>"]
        }
      }
    }
  ],
  "outbounds": [
    { "protocol": "freedom", "tag": "direct" },
    { "protocol": "blackhole", "tag": "block" }
  ],
  "routing": {
    "rules": [
      { "type": "field", "inboundTag": ["fallback-filter"], "domain": ["full:speed.cloudflare.com"], "outboundTag": "direct" },
      { "type": "field", "inboundTag": ["fallback-filter"], "outboundTag": "block" }
    ]
  }
}
```

保存后让服务用户可以读配置，但其他普通用户不能读：

```bash
sudo chown root:nogroup /usr/local/etc/xray/config.json
sudo chmod 640 /usr/local/etc/xray/config.json
sudo /usr/local/bin/xray run -test -config /usr/local/etc/xray/config.json
sudo systemctl restart xray
systemctl is-active xray
sudo ss -lntup | grep -E ':4431|:443 '
sudo ufw allow 443/tcp
sudo ufw status verbose
```

预期是 Xray `active`、`127.0.0.1:4431` 仅本机监听、TCP `*:443` 对外监听。我们曾把 Xray 的 systemd 能力范围从安装器默认值进一步缩到仅 `CAP_NET_BIND_SERVICE`；这是可选加固，基础复现先确保服务正常。命令和字段将随 Xray 版本演进，若验证失败，先看 `sudo journalctl -u xray -n 50 --no-pager` 并对照官方文档。

客户端需要的 VLESS 分享链接结构如下；`pbk` 填 **Xray 公钥**，绝不能填服务端私钥：

```text
vless://<UUID>@<VPS_IP>:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=speed.cloudflare.com&fp=chrome&pbk=<XRAY_PUBLIC_KEY>&sid=<SHORT_ID>&type=tcp#DediRock-LA
```

我们当时的部署脚本随机生成 UUID、X25519 密钥对和 Short ID，先用 Xray 校验临时配置，再原子替换配置文件；分享链接存为 `/home/vpsadmin/dedirock-vless.txt`，权限为 `600`，命令行没有打印真实凭据。读者手工操作时，也应把分享链接保存在仅自己可读的文件里。

## 8. 第二条节点：Hysteria 2

因为第一条节点在部分手机网络上网页体验波动明显，我们又安装了 HY2 做 UDP 对照。安装器、配置字段和二维码 URI 均以 [Hysteria 官方安装文档](https://v2.hysteria.network/docs/getting-started/Server-Installation-Script/)、[服务端配置文档](https://v2.hysteria.network/docs/advanced/Full-Server-Config/)及[URI 规范](https://v2.hysteria.network/docs/developers/URI-Scheme/)为准。安装器只安装程序并生成示例配置，仍需手工配置。**HY2 使用 UDP 443；打开 TCP 443 不会让 HY2 自动可用。**

在 VPS 上执行：

```bash
curl -fsSL https://get.hy2.sh/ -o ~/hysteria-install.sh
sudo bash ~/hysteria-install.sh
sudo systemctl cat hysteria-server.service
```

我们的安装结果是 `/usr/local/bin/hysteria`、`/etc/hysteria/config.yaml` 和 `hysteria-server.service`，服务用户为 `hysteria`。若安装器的路径或用户有变化，应以 `systemctl cat` 实际输出为准。

我们没有买域名，而是为自己的 VPS 生成**自签名证书**。把 `<VPS_IP>` 换成自己的公网 IP 后运行：

```bash
sudo install -d -m 750 -o root -g hysteria /etc/hysteria
sudo openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -days 3650 -subj '/CN=private-vps' -addext 'subjectAltName=IP:<VPS_IP>' \
  -keyout /etc/hysteria/server.key -out /etc/hysteria/server.crt
sudo chown root:hysteria /etc/hysteria/server.key /etc/hysteria/server.crt
sudo chmod 640 /etc/hysteria/server.key
sudo chmod 644 /etc/hysteria/server.crt
sudo openssl x509 -noout -fingerprint -sha256 -in /etc/hysteria/server.crt
openssl rand -hex 24
```

最后一行生成客户端认证密码。证书指纹要从**刚生成的证书**计算，不能从网上复制别人的。用 `sudo nano /etc/hysteria/config.yaml` 写入：

```yaml
listen: :443
tls:
  cert: /etc/hysteria/server.crt
  key: /etc/hysteria/server.key
  sniGuard: disable
auth:
  type: password
  password: <HY2_PASSWORD>
masquerade:
  type: proxy
  proxy:
    url: https://www.cloudflare.com/
    rewriteHost: true
```

这是我们实际采用的口令认证、证书和伪装站点。`masquerade` 是服务端对普通 HTTP/3 请求返回的网页内容，**不是 Cloudflare CDN 中转**；该 VPS 仍是客户端直接连接的服务器。配置文件包含密码，只让 root 和服务用户读取：

```bash
sudo chown root:hysteria /etc/hysteria/config.yaml
sudo chmod 640 /etc/hysteria/config.yaml
sudo ufw allow 443/udp
sudo systemctl enable --now hysteria-server.service
sudo systemctl restart hysteria-server.service
systemctl is-active hysteria-server.service
sudo ss -lunp | grep ':443'
sudo ufw status verbose
```

预期 HY2 服务为 `active`，UDP 443 在监听，UFW 同时允许 TCP 443 和 UDP 443。若启动失败，查看 `sudo journalctl -u hysteria-server -n 50 --no-pager`；常见原因是 YAML 缩进、证书路径、文件权限、密码或端口配置错误。

HY2 分享链接示意：

```text
hysteria2://<HY2_PASSWORD>@<VPS_IP>:443/?insecure=1&pinSHA256=<URL编码后的证书SHA256指纹>#DediRock-HY2
```

自签名证书通常需要客户端设置 `insecure=1`。单独开启这个选项会削弱服务器身份验证，因此我们在分享 URI 中同时放入 `pinSHA256`，让支持该参数的客户端核对证书指纹。[Hysteria 客户端文档](https://v2.hysteria.network/docs/getting-started/Client/)也建议这样做。**只有确认客户端确实支持并应用证书固定，才能把它算作已验证；如果客户端不支持，应改用自己域名的可信证书。**我们当时在 Shadowrocket 界面中没有找到单独显示证书指纹的设置，因此不能仅凭 URI 中写了 `pinSHA256` 就断言客户端已执行核验。

生成 URI 时先从证书输出中取出 `SHA256 Fingerprint=` 后面的值，再做 URL 编码。例如在 VPS 输入下面的命令后，把得到的编码结果放进上方 URI 的 `pinSHA256` 参数；不要把示例中的占位符原样留在链接里：

```bash
sudo openssl x509 -noout -fingerprint -sha256 -in /etc/hysteria/server.crt
python3 -c 'from urllib.parse import quote; print(quote(input("粘贴证书 SHA256 指纹: ").strip(), safe=""))'
```

## 9. 生成二维码并导入 Shadowrocket

在 VPS 安装 `qrencode`：

```bash
sudo apt install -y qrencode
```

把**自己的** VLESS 和 HY2 分享链接分别保存为 `~/dedirock-vless.txt`、`~/dedirock-hy2.txt`，每个文件只写一行完整 URI。下面的 `nano` 会打开编辑器：粘贴链接，按 `Control+O`、回车保存，再按 `Control+X` 退出。然后设置权限并生成二维码：

```bash
umask 077
nano ~/dedirock-vless.txt
nano ~/dedirock-hy2.txt
chmod 600 ~/dedirock-vless.txt ~/dedirock-hy2.txt
(umask 077; tr -d '\r\n' < ~/dedirock-vless.txt | qrencode -s 8 -l M -o ~/dedirock-vless.png)
(umask 077; tr -d '\r\n' < ~/dedirock-hy2.txt | qrencode -s 8 -l M -o ~/dedirock-hy2.png)
```

在 **Mac 终端** 下载图片：

```bash
scp -i ~/.ssh/dedirock_vps -o IdentitiesOnly=yes \
  vpsadmin@<VPS_IP>:/home/vpsadmin/dedirock-hy2.png ~/Downloads/
```

在 Mac 打开 `~/Downloads/dedirock-hy2.png`，用 iPhone Shadowrocket 扫码导入；Mac 版也可以导入分享链接或图片。导入后选择节点，再通过 [Cloudflare trace 页面](https://www.cloudflare.com/cdn-cgi/trace)等确认出口 IP。二维码**包含完整连接凭据**：别人只要得到图片就能导入，也能继续转发。

## 10. 我们实际踩过的坑

总结本次的流程大概是，购买 VPS → SSH 连接并更新 Debian → 配置管理员账号、密钥登录和防火墙 → 搭建 VLESS + REALITY → 尝试 BBR → 增加 HY2 节点 → 改用电信热点测试。一般来说搭建完VLESS + REALITY作为第一个节点就可以使用了，但是实测效果非常不好网络波动严重，我猜测可能是拥塞控制算法的问题，于是尝试BBR，使用了之后感觉稍微好了一点点，但是总体仍然很差， 于是我尝试使用HY2的方式搭建节点，这种方式的优点就是通过 **UDP/QUIC** 连接 VPS，实际上使用了HY2搭建之后，仍然是体感上稍微好了一些，但是网路仍然明显波动。**最后我尝试将联通运营商网络切换为电信网络，发现网络总体稳定，速度提升了很多，这也是本次搭建过程中遇到的最大的问题。**



## 11. 日常维护与安全边界

常用只读检查命令，在 VPS 上运行：

```bash
systemctl is-active xray hysteria-server ssh
sudo ufw status verbose
sudo ss -lntup
sudo journalctl -u xray -n 50 --no-pager
sudo journalctl -u hysteria-server -n 50 --no-pager
```

不使用时可以关闭 Mac、iPhone 的客户端；VPS 上的服务继续运行。升级软件前备份 `/usr/local/etc/xray/config.json`、`/etc/hysteria/config.yaml` 和证书私钥，备份也要限权保存。分享二维码等同于分享账号：被转发后，其他人也可使用。若怀疑泄露，应更换对应节点的认证信息并重新导入自己的设备；单一共享密码无法只踢掉某一个转发者。

选购下一台 VPS 时，最重要的经验不是只看 CPU、内存、端口标称 1 Gbps 或是否“有 CN 加速”，而是尽量找同机房测试 IP、试用期或退款规则，**用自己实际的运营商和使用时段测试到该机房的路径、丢包和持续下载**。同价位的 VPS 也可能因上游、对等互联、拥塞和路由不同而有明显差别。我们的结果是：这台机器足以搭出可用的私人节点，但在不同热点与时段的稳定性未达到稳定优质线路的水平；单换协议没有根除波动。

## 官方资料

* [DediRock 客户区](https://billing.dedirock.com/)与[服务条款](https://dedirock.com/terms-of-services/)
* [Xray 官方安装器](https://github.com/XTLS/Xray-install)、[REALITY 配置说明](https://xtls.github.io/en/config/transports/reality.html)、[VLESS + REALITY 示例](https://github.com/XTLS/Xray-examples/blob/main/VLESS-TCP-XTLS-Vision-REALITY/config_server.jsonc)
* [Hysteria 2 安装](https://v2.hysteria.network/docs/getting-started/Server-Installation-Script/)、[服务端配置](https://v2.hysteria.network/docs/advanced/Full-Server-Config/)、[客户端证书校验](https://v2.hysteria.network/docs/getting-started/Client/)、[分享 URI 格式](https://v2.hysteria.network/docs/developers/URI-Scheme/)

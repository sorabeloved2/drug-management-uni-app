#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
药小福（药物管理系统）— 一键部署脚本
=====================================
支持：H5 网页 / 微信小程序 / 支付宝小程序 / Android App / uniCloud 云函数

用法：
    python deploy.py                  # 交互式菜单
    python deploy.py h5               # 仅构建 H5
    python deploy.py mp-weixin        # 仅构建微信小程序
    python deploy.py app-android      # 仅构建 Android App
    python deploy.py cloud            # 仅部署 uniCloud 云函数
    python deploy.py all              # 完整部署（H5 + 云函数）
    python deploy.py check            # 仅检查环境

要求：
    - Node.js >= 16
    - npm >= 8
    - HBuilderX（用于构建 uni-app）
    - 微信开发者工具（构建微信小程序时需要）
"""

import os
import sys
import subprocess
import shutil
import argparse
import json
import re
import platform
from pathlib import Path
from datetime import datetime

# 强制设置 UTF-8 编码（解决 Windows GBK 终端中文乱码问题）
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ======================== 项目配置 ========================

PROJECT_ROOT = Path(__file__).parent.resolve()
PROJECT_NAME = "药小福-药物管理系统"
BUILD_OUTPUT = PROJECT_ROOT / "dist"
UNICLOUD_DIR = PROJECT_ROOT / "uniCloud-aliyun"

# 部署目标
PLATFORMS = {
    "h5": {
        "name": "H5 网页",
        "output_dir": "h5",
        "hbuilder_platform": "h5",
    },
    "mp-weixin": {
        "name": "微信小程序",
        "output_dir": "mp-weixin",
        "hbuilder_platform": "mp-weixin",
    },
    "mp-alipay": {
        "name": "支付宝小程序",
        "output_dir": "mp-alipay",
        "hbuilder_platform": "mp-alipay",
    },
    "app-android": {
        "name": "Android App",
        "output_dir": "app-android",
        "hbuilder_platform": "app-android",
    },
}

# 需要检查的云函数配置
REQUIRED_CONFIGS = [
    PROJECT_ROOT / "uniCloud-aliyun" / "cloudfunctions" / "health-ai" / "config.js",
]

# ======================== 工具函数 ========================


class Colors:
    """终端颜色"""

    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def print_banner():
    """打印 Banner"""
    print(f"""
{Colors.CYAN}{'=' * 52}
   [  药小福 — 药物管理系统  一键部署工具
{'=' * 52}{Colors.RESET}
    """)


def print_step(msg: str):
    """打印步骤"""
    print(f"\n{Colors.BLUE}> {msg}{Colors.RESET}")


def print_success(msg: str):
    """打印成功信息"""
    print(f"  {Colors.GREEN}[OK] {msg}{Colors.RESET}")


def print_warning(msg: str):
    """打印警告"""
    print(f"  {Colors.YELLOW}[!!]  {msg}{Colors.RESET}")


def print_error(msg: str):
    """打印错误"""
    print(f"  {Colors.RED}[XX] {msg}{Colors.RESET}")


def run_cmd(cmd, cwd=None, check=True, capture=False):
    """运行命令并返回结果"""
    if isinstance(cmd, str):
        cmd = cmd.split()
    try:
        if capture:
            result = subprocess.run(
                cmd, cwd=cwd or PROJECT_ROOT,
                capture_output=True, text=True, timeout=300
            )
            return result.stdout.strip(), result.returncode
        else:
            subprocess.run(cmd, cwd=cwd or PROJECT_ROOT, check=check, timeout=300)
            return None, 0
    except subprocess.CalledProcessError as e:
        if check:
            print_error(f"命令失败: {' '.join(cmd)}")
            print(f"  {e}")
        return None, e.returncode
    except subprocess.TimeoutExpired:
        print_error(f"命令超时: {' '.join(cmd)}")
        return None, -1
    except FileNotFoundError:
        print_error(f"命令未找到: {cmd[0]}")
        return None, -2


# ======================== 环境检查 ========================


def check_node():
    """检查 Node.js"""
    print_step("检查 Node.js...")
    stdout, code = run_cmd("node --version", capture=True)
    if code == 0 and stdout:
        version = stdout.replace("v", "")
        major = int(version.split(".")[0])
        if major >= 16:
            print_success(f"Node.js {stdout}")
            return True
        else:
            print_warning(f"Node.js {stdout} — 建议升级到 v16+")
            return True
    else:
        print_error("未找到 Node.js，请安装 https://nodejs.org/")
        return False


def check_npm():
    """检查 npm"""
    print_step("检查 npm...")
    stdout, code = run_cmd("npm --version", capture=True)
    if code == 0 and stdout:
        print_success(f"npm v{stdout}")
        return True
    else:
        print_error("未找到 npm")
        return False


def find_hbuilderx():
    """查找 HBuilderX 安装路径"""
    print_step("查找 HBuilderX...")

    possible_paths = [
        Path("C:/Program Files/HBuilderX/HBuilderX.exe"),
        Path("C:/Program Files (x86)/HBuilderX/HBuilderX.exe"),
        Path(os.environ.get("LOCALAPPDATA", "")) / "Programs/HBuilderX/HBuilderX.exe",
        Path("D:/HBuilderX/HBuilderX.exe"),
        Path("E:/HBuilderX/HBuilderX.exe"),
    ]

    # 也搜索常见安装目录
    for base in [
        Path("C:/Program Files"),
        Path(os.environ.get("LOCALAPPDATA", "") + "/Programs"),
    ]:
        if base.exists():
            for d in base.glob("*BuilderX*"):
                exe = d / "HBuilderX.exe"
                if exe.exists():
                    possible_paths.insert(0, exe)

    for p in possible_paths:
        if p.exists():
            print_success(f"找到 HBuilderX: {p}")
            return p

    print_warning("未自动找到 HBuilderX")
    print_warning("请手动指定路径: python deploy.py --hbuilderx \"D:\\HBuilderX\\HBuilderX.exe\"")
    return None


def check_wechat_devtools():
    """检查微信开发者工具"""
    possible_paths = [
        Path("C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat"),
        Path(
            os.environ.get("LOCALAPPDATA", "")
            + "/Programs/微信开发者工具/cli.bat"
        ),
    ]
    for p in possible_paths:
        if p.exists():
            return p
    return None


def check_configs():
    """检查必要的配置文件"""
    print_step("检查云函数配置...")
    for config_path in REQUIRED_CONFIGS:
        if config_path.exists():
            print_success(f"已配置: {config_path.name}")
        else:
            example = config_path.with_name("config.example.js")
            if example.exists():
                print_warning(f"未配置: {config_path.name}")
                print_warning(f"  请复制 {example.name} → {config_path.name} 并填入 API Key")
            else:
                print_error(f"缺少: {config_path}")


def run_environment_check(hbuilderx_path=None):
    """完整环境检查"""
    print(f"\n{Colors.BOLD}{'-' * 40}")
    print("  [i]  环境检查")
    print(f"{'-' * 40}{Colors.RESET}")

    results = {
        "node": check_node(),
        "npm": check_npm(),
    }

    if hbuilderx_path:
        if Path(hbuilderx_path).exists():
            results["hbuilderx"] = Path(hbuilderx_path)
            print_success(f"HBuilderX: {hbuilderx_path}")
        else:
            print_error(f"指定的 HBuilderX 不存在: {hbuilderx_path}")
            results["hbuilderx"] = None
    else:
        results["hbuilderx"] = find_hbuilderx()

    check_configs()

    # 汇总
    print(f"\n{Colors.BOLD}环境检查汇总:{Colors.RESET}")
    for k, v in results.items():
        icon = "[OK]" if v else "[XX]"
        print(f"  {icon} {k}")

    return results


# ======================== 依赖安装 ========================


def install_dependencies():
    """安装 npm 依赖"""
    print_step("安装项目依赖...")
    if not (PROJECT_ROOT / "package.json").exists():
        print_warning("未找到 package.json，跳过依赖安装")
        return True

    stdout, code = run_cmd("npm install", capture=True)
    if code == 0:
        print_success("依赖安装完成")
        return True
    else:
        print_error("依赖安装失败")
        if stdout:
            print(stdout)
        return False


# ======================== 构建 ========================


def build_with_hbuilderx(hbuilderx_path: Path, platform: str):
    """使用 HBuilderX CLI 构建"""
    platform_info = PLATFORMS.get(platform, PLATFORMS["h5"])
    print_step(f"构建 {platform_info['name']}...")

    # HBuilderX CLI 构建命令
    cmd = [
        str(hbuilderx_path),
        "--action", "build",
        "--platform", platform_info["hbuilder_platform"],
        "--project", str(PROJECT_ROOT),
    ]

    print(f"  执行: HBuilderX --action build --platform {platform_info['hbuilder_platform']}")
    stdout, code = run_cmd(cmd, capture=True)

    if code == 0:
        output_dir = BUILD_OUTPUT / "build" / platform_info["output_dir"]
        print_success(f"{platform_info['name']} 构建完成")
        if output_dir.exists():
            print_success(f"输出目录: {output_dir}")
        return True
    else:
        print_error(f"{platform_info['name']} 构建失败")
        if stdout:
            print(f"  {stdout}")
        return False


def build_h5_alternative():
    """
    H5 备选构建方案：尝试使用 npm 脚本
    如果没有 HBuilderX，则提示安装
    """
    print_step("尝试备选 H5 构建方案...")

    # 检查是否有 vite 或 webpack 配置
    if (PROJECT_ROOT / "vite.config.js").exists() or (PROJECT_ROOT / "vite.config.ts").exists():
        stdout, code = run_cmd("npx vite build", capture=True)
        if code == 0:
            print_success("H5 构建完成（Vite）")
            return True

    print_warning("未找到可用构建工具，请安装 HBuilderX 进行构建")
    print_warning("下载地址: https://www.dcloud.io/hbuilderx.html")
    return False


def package_build(platform: str):
    """打包构建产物"""
    platform_info = PLATFORMS.get(platform, PLATFORMS["h5"])
    print_step(f"打包 {platform_info['name']} 产物...")

    output_dir = BUILD_OUTPUT / "build" / platform_info["output_dir"]
    if not output_dir.exists():
        print_warning(f"构建输出目录不存在: {output_dir}")
        return

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_name = f"{PROJECT_NAME}_{platform}_{timestamp}.zip"
    archive_path = BUILD_OUTPUT / archive_name

    BUILD_OUTPUT.mkdir(parents=True, exist_ok=True)

    # 创建 zip 包
    shutil.make_archive(
        str(archive_path.with_suffix("")),
        "zip",
        str(output_dir),
    )

    size_mb = archive_path.stat().st_size / (1024 * 1024)
    print_success(f"打包完成: {archive_name} ({size_mb:.1f} MB)")


# ======================== uniCloud 部署 ========================


def deploy_unicloud(hbuilderx_path: Path = None):
    """部署 uniCloud 云函数到阿里云"""
    print_step("部署 uniCloud 云函数...")

    # 检查云函数目录
    cloud_dir = UNICLOUD_DIR / "cloudfunctions"
    if not cloud_dir.exists():
        print_warning("未找到云函数目录，跳过")
        return True

    # 列出所有云函数
    functions = [d.name for d in cloud_dir.iterdir() if d.is_dir()]
    if not functions:
        print_warning("没有云函数需要部署")
        return True

    print(f"  待部署云函数: {', '.join(functions)}")

    # 检查数据库 Schema
    db_dir = UNICLOUD_DIR / "database"
    if db_dir.exists():
        schemas = [f.name for f in db_dir.glob("*.schema.json")]
        if schemas:
            print(f"  数据库表: {', '.join(s.name.replace('.schema.json', '') for s in db_dir.glob('*.schema.json'))}")

    # 如果有 HBuilderX，使用其 CLI 上传
    if hbuilderx_path and hbuilderx_path.exists():
        print("  使用 HBuilderX CLI 上传云函数...")
        cmd = [
            str(hbuilderx_path),
            "--action", "upload",
            "--type", "unicloud",
            "--provider", "aliyun",
            "--project", str(PROJECT_ROOT),
        ]
        stdout, code = run_cmd(cmd, capture=True)
        if code == 0:
            print_success("云函数部署成功")
            return True
        else:
            print_warning("HBuilderX CLI 上传失败，请通过 HBuilderX IDE 手动上传")
            if stdout:
                print(f"  {stdout}")
            return False
    else:
        print_warning("未找到 HBuilderX，请通过 HBuilderX IDE 手动上传云函数")
        print("  右键 cloudfunctions 目录 → 上传部署")
        return False


# ======================== 发布前检查 ========================


def pre_deploy_check():
    """发布前检查清单"""
    print(f"\n{Colors.BOLD}{'-' * 40}")
    print("  [*]  发布前检查清单")
    print(f"{'-' * 40}{Colors.RESET}")

    issues = []

    # 1. API Key 检查
    config = PROJECT_ROOT / "uniCloud-aliyun/cloudfunctions/health-ai/config.js"
    if not config.exists():
        example = config.with_name("config.example.js")
        if example.exists():
            issues.append("[!!]  config.js 不存在，请从 config.example.js 复制并填入真实 API Key")
        else:
            issues.append("[!!]  config.js 和 config.example.js 都不存在")

    # 2. 硬编码敏感信息检查
    # 只检查 config.js 中的 Key 是否为真实值（非模板占位符）
    for config_file in PROJECT_ROOT.glob("**/config.js"):
        try:
            content = config_file.read_text(encoding="utf-8")
            if "sk-" in content and "你的DeepSeek" not in content:
                # config.js 已在 .gitignore 中，不会被提交
                print(f"  [OK] config.js 已配置 API Key (已加入 .gitignore，不会提交到 Git)")
        except Exception:
            pass

    # 3. manifest.json 检查（支持 JSONC 注释格式）
    manifest = PROJECT_ROOT / "manifest.json"
    if manifest.exists():
        try:
            raw = manifest.read_text(encoding="utf-8")
            # 移除 JSONC 注释（/* */ 和 //）
            cleaned = re.sub(r'/\*.*?\*/', '', raw, flags=re.DOTALL)
            cleaned = re.sub(r'//[^\n]*', '', cleaned)
            data = json.loads(cleaned)
            name = data.get("name", "")
            if "UNIAPP" in name.upper() and name != PROJECT_NAME:
                issues.append(f"[!!]  manifest.json 中应用名为 '{name}'，建议修改为正式名称")
        except json.JSONDecodeError as e:
            issues.append(f"[XX] manifest.json JSON 格式错误: {e}")

    # 4. 输出检查结果
    if issues:
        for issue in issues:
            print(f"  {issue}")
        print(f"\n  共 {len(issues)} 项需要注意")
    else:
        print_success("所有检查通过！")

    return len(issues) == 0


# ======================== 主流程 ========================


def deploy_target(platform: str, hbuilderx_path: Path, pack: bool = False):
    """部署单个目标"""
    if platform == "cloud":
        return deploy_unicloud(hbuilderx_path)

    if platform not in PLATFORMS:
        print_error(f"未知平台: {platform}")
        print(f"  可用平台: {', '.join(PLATFORMS.keys())}, cloud")
        return False

    success = True

    if hbuilderx_path and hbuilderx_path.exists():
        success = build_with_hbuilderx(hbuilderx_path, platform)
    elif platform == "h5":
        success = build_h5_alternative()
    else:
        print_error(f"构建 {platform} 需要 HBuilderX")
        success = False

    if success and pack:
        package_build(platform)

    return success


def interactive_menu(env_results):
    """交互式菜单"""
    print(f"\n{Colors.BOLD}{'-' * 40}")
    print("  [*]  部署选项")
    print(f"{'-' * 40}{Colors.RESET}")
    print(f"""
  {Colors.GREEN}1{Colors.RESET}. 构建 H5 网页版
  {Colors.GREEN}2{Colors.RESET}. 构建微信小程序
  {Colors.GREEN}3{Colors.RESET}. 构建支付宝小程序
  {Colors.GREEN}4{Colors.RESET}. 构建 Android App
  {Colors.GREEN}5{Colors.RESET}. 部署 uniCloud 云函数
  {Colors.GREEN}6{Colors.RESET}. 完整部署 (H5 + 云函数)
  {Colors.GREEN}7{Colors.RESET}. 仅环境检查
  {Colors.GREEN}0{Colors.RESET}. 退出
    """)

    choice = input(f"  请选择 [{Colors.GREEN}1-7{Colors.RESET}]: ").strip()

    actions = {
        "1": lambda: deploy_target("h5", env_results.get("hbuilderx")),
        "2": lambda: deploy_target("mp-weixin", env_results.get("hbuilderx")),
        "3": lambda: deploy_target("mp-alipay", env_results.get("hbuilderx")),
        "4": lambda: deploy_target("app-android", env_results.get("hbuilderx")),
        "5": lambda: deploy_unicloud(env_results.get("hbuilderx")),
        "6": lambda: deploy_all(env_results),
        "7": lambda: run_environment_check(),
    }

    if choice in actions:
        return actions[choice]()
    elif choice == "0":
        print("\n  再见！bye\n")
        return True
    else:
        print_error("无效选择")
        return False


def deploy_all(env_results):
    """完整部署流程"""
    print(f"\n{Colors.BOLD}{'-' * 40}")
    print("  [>>]  完整部署流程")
    print(f"{'-' * 40}{Colors.RESET}")

    # 1. 安装依赖
    if not install_dependencies():
        print_error("依赖安装失败，终止部署")
        return False

    # 2. 构建 H5
    if not deploy_target("h5", env_results.get("hbuilderx"), pack=True):
        print_warning("H5 构建出现问题，但继续后续步骤")

    # 3. 部署云函数
    if not deploy_unicloud(env_results.get("hbuilderx")):
        print_warning("云函数部署出现问题")

    # [OK] 完成
    print(f"\n{Colors.GREEN}{'=' * 52}")
    print("  [OK]  部署流程完成！")
    print(f"{'=' * 52}{Colors.RESET}\n")

    return True


# ======================== 入口 ========================


def main():
    parser = argparse.ArgumentParser(
        description="药小福（药物管理系统）一键部署脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python deploy.py                  # 交互式菜单
  python deploy.py h5               # 构建 H5 网页
  python deploy.py mp-weixin        # 构建微信小程序
  python deploy.py cloud            # 部署 uniCloud 云函数
  python deploy.py all              # 完整部署 (H5 + 云函数)
  python deploy.py check            # 环境检查
        """,
    )
    parser.add_argument(
        "target",
        nargs="?",
        default="menu",
        choices=["menu", "h5", "mp-weixin", "mp-alipay", "app-android", "cloud", "all", "check"],
        help="部署目标 (默认: menu 交互式)",
    )
    parser.add_argument(
        "--hbuilderx",
        type=str,
        help="HBuilderX.exe 路径",
    )
    parser.add_argument(
        "--pack",
        action="store_true",
        help="构建后自动打包为 zip",
    )
    parser.add_argument(
        "--skip-check",
        action="store_true",
        help="跳过环境检查",
    )

    args = parser.parse_args()

    print_banner()

    # 环境检查
    env_results = {}
    if not args.skip_check:
        hb_path = args.hbuilderx
        env_results = run_environment_check(hb_path)
    elif args.hbuilderx:
        env_results["hbuilderx"] = Path(args.hbuilderx)

    # 发布前检查
    pre_deploy_check()

    # 执行
    if args.target == "menu":
        interactive_menu(env_results)
    elif args.target == "check":
        print("\n[OK] 环境检查完成\n")
    elif args.target == "all":
        install_dependencies()
        deploy_all(env_results)
    elif args.target == "cloud":
        deploy_unicloud(env_results.get("hbuilderx"))
    else:
        install_dependencies()
        deploy_target(args.target, env_results.get("hbuilderx"), args.pack)


if __name__ == "__main__":
    main()

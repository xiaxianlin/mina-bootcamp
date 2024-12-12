#!/bin/bash
source_file="src/$1/main.ts"
target_file="build/src/$1/main.js"

echo "执行程序：$1"


rm -rf build

if [ -e $source_file ]; then
    npm run build
else
    echo "$source_file 程序不存在"
fi

if [ -e $target_file ]; then
    node $target_file
else
    echo "未找到编译后文件：$target_file"
fi
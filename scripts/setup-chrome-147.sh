#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TEST_ROOT="$ROOT/.chrome-ui-test"
ZIP="$TEST_ROOT/chrome-147-linux64.zip"
URL="https://storage.googleapis.com/chrome-for-testing-public/147.0.7727.102/linux64/chrome-linux64.zip"

mkdir -p "$TEST_ROOT/chrome-147" "$TEST_ROOT/debs" "$TEST_ROOT/sysroot" "$TEST_ROOT/fonts" "$TEST_ROOT/font-cache"
curl -fL "$URL" -o "$ZIP"
unzip -q -o "$ZIP" -d "$TEST_ROOT/chrome-147"
curl -fL 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf' \
  -o "$TEST_ROOT/fonts/NotoSansTC.ttf"
curl -fL 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/fonts/NotoColorEmoji.ttf' \
  -o "$TEST_ROOT/fonts/NotoColorEmoji.ttf"

(
  cd "$TEST_ROOT/debs"
  apt-get download \
    libatk1.0-0 libatk-bridge2.0-0 libatspi2.0-0 libcairo2 libcups2 \
    libgbm1 libpango-1.0-0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libasound2 libxkbcommon0 libavahi-common3 libavahi-client3 \
    libwayland-server0 libxcb-randr0 libpixman-1-0 libxcb-shm0 \
    libxcb-render0 libxrender1 libthai0 libharfbuzz0b libxi6 \
    libdatrie1 libgraphite2-3
)

for deb in "$TEST_ROOT"/debs/*.deb; do
  dpkg-deb -x "$deb" "$TEST_ROOT/sysroot"
done

cat > "$TEST_ROOT/fonts.conf" <<EOF
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
  <dir>$TEST_ROOT/fonts</dir>
  <cachedir>$TEST_ROOT/font-cache</cachedir>
</fontconfig>
EOF

LD_LIBRARY_PATH="$TEST_ROOT/sysroot/usr/lib/x86_64-linux-gnu" \
  "$TEST_ROOT/chrome-147/chrome-linux64/chrome" --version

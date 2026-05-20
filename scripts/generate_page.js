const fs = require("fs");
const path = require("path");

// ディレクトリ設定
const DATA_ROOT = path.join(__dirname, "../data/anthology");
const TEMPLATE_PATH = path.join(__dirname, "../templates/anthology.html");
const OUTPUT_ROOT = path.join(__dirname, "../anthology");

// テンプレート読み込み
const template = fs.readFileSync(TEMPLATE_PATH, "utf8");

// data/anthology/ 配下のフォルダ一覧を取得
const anthologyDirs = fs.readdirSync(DATA_ROOT).filter(dir => {
  const full = path.join(DATA_ROOT, dir);
  return fs.statSync(full).isDirectory();
});

anthologyDirs.forEach(id => {
  const jsonPath = path.join(DATA_ROOT, id, "data.json");

  if (!fs.existsSync(jsonPath)) {
    console.log(`Skip: ${id} (data.json が存在しない)`);
    return;
  }

  const raw = fs.readFileSync(jsonPath, "utf8");
  const data = JSON.parse(raw);

  // 出力フォルダ
  const outDir = path.join(OUTPUT_ROOT, id);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // テンプレ差し込み
  let html = template;

  // 1. 単純置換
  const replaceMap = {
    "${id}": data.id || "",
    "${title}": data.title || "",
    "${theme}": data.theme || "",
    "${release}": data.release || "",
    "${comment}": data.comment || "",
    "${custom.section_title}": data.custom?.section_title || "",
    "${custom.content}": data.custom?.content || "",
    "${images.notice}": data.images?.notice || "",
    "${images.cover}": data.images?.cover || "",
    "${images.banner}": data.images?.banner || "",
    "${contributors_image}": data.contributors_image || "",
    "${organizers.main_name}": data.organizers?.main_name || "",
    "${organizers.main_twitter}": data.organizers?.main_twitter || "",
    "${organizers.sub_name}": data.organizers?.sub_name || "",
    "${organizers.sub_twitter}": data.organizers?.sub_twitter || ""
  };

  for (const key in replaceMap) {
    html = html.replace(new RegExp(key, "g"), replaceMap[key]);
  }

  // 2. サンプル画像（配列 → HTML）
  const sampleHTML = (data.sample_images || [])
    .filter(x => x)
    .map(src => `<img src="${src}" class="sample-img">`)
    .join("\n");

  html = html.replace(/\$\{sample_images\}/g, sampleHTML);

  // 3. 通販リンク（配列 → HTML）
  const storeHTML = (data.stores || [])
    .filter(x => x)
    .map(url => `<a href="${url}" target="_blank" class="store-link">${url}</a>`)
    .join("<br>");

  html = html.replace(/\$\{store_1\}/g, data.stores?.[0] || "");

  // 出力
  const outPath = path.join(outDir, "index.html");
  fs.writeFileSync(outPath, html, "utf8");

  console.log(`Generated: ${outPath}`);
});

console.log("All anthology pages generated.");

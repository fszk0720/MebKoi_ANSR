// ===== 設定 =====
const OWNER = "YOUR_GITHUB_USERNAME";        // ← GitHubユーザー名
const REPO = "anthology-event";              // ← リポジトリ名
const BRANCH = "main";                       // ← ブランチ名
const TOKEN = "YOUR_GITHUB_TOKEN";           // ← PAT（後で環境変数化OK）

// ===== ランダムID生成 =====
function generateId() {
  return "anth-" + Math.random().toString(36).substring(2, 10);
}

// ===== パスワード生成 =====
function generatePassword() {
  return Math.random().toString(36).slice(-10);
}

// ===== SHA-256 ハッシュ =====
async function sha256(text) {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ===== GitHub API: ファイルアップロード =====
async function uploadToGitHub(path, content, isBinary = false) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;

  const body = {
    message: `Upload ${path}`,
    branch: BRANCH,
    content: isBinary
      ? btoa(String.fromCharCode(...new Uint8Array(content)))
      : btoa(unescape(encodeURIComponent(content)))
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub Upload Error: ${err}`);
  }
}

// ===== メイン処理 =====
document.getElementById("anthologyForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1. フォーム値取得
  const form = e.target;
  const title = form.title.value;
  const theme = form.theme.value;
  const release = form.release.value;
  const comment = form.comment.value;

  const main_name = form.main_name.value;
  const main_twitter = form.main_twitter.value;
  const sub_name = form.sub_name.value;
  const sub_twitter = form.sub_twitter.value;

  const store1 = form.store1.value;
  const store2 = form.store2.value;
  const store3 = form.store3.value;

  const custom_title = form.custom_title.value;
  const custom_content = form.custom_content.value;

  // 2. id と password を生成
  const id = generateId();
  const password = generatePassword();
  const password_hash = await sha256(password);

  // 3. 画像ファイル取得
  const notice = form.notice.files[0];
  const cover = form.cover.files[0];
  const banner = form.banner.files[0];
  const contributors = form.contributors.files[0];
  const samples = [...form.samples.files];

  // 4. GitHub にアップロードするパス
  const baseImagePath = `images/anthology/${id}/`;
  const baseJsonPath = `data/anthology/${id}/`;

  // 5. 画像アップロード
  async function uploadImage(file, name) {
    if (!file) return "";
    const arrayBuffer = await file.arrayBuffer();
    const path = `${baseImagePath}${name}`;
    await uploadToGitHub(path, arrayBuffer, true);
    return path;
  }

  const noticePath = await uploadImage(notice, "notice.png");
  const coverPath = await uploadImage(cover, "cover.png");
  const bannerPath = await uploadImage(banner, "banner.png");
  const contributorsPath = await uploadImage(contributors, "contributors.png");

  const samplePaths = [];
  for (let i = 0; i < samples.length; i++) {
    const p = await uploadImage(samples[i], `sample${i + 1}.png`);
    samplePaths.push(p);
  }

  // 6. JSON データ構築
  const jsonData = {
    id,
    password_hash,
    title,
    theme,
    release,
    comment,
    organizers: {
      main_name,
      main_twitter,
      sub_name,
      sub_twitter
    },
    images: {
      notice: noticePath,
      cover: coverPath,
      banner: bannerPath
    },
    contributors_image: contributorsPath,
    sample_images: samplePaths,
    stores: [store1, store2, store3].filter(x => x),
    custom: {
      section_title: custom_title,
      content: custom_content
    }
  };

  // 7. JSON を GitHub にアップロード
  await uploadToGitHub(
    `${baseJsonPath}data.json`,
    JSON.stringify(jsonData, null, 2)
  );

  // 8. 完了メッセージ
  alert(
    `登録が完了しました！\n\n` +
    `ID: ${id}\n` +
    `パスワード: ${password}\n\n` +
    `※この2つは必ず控えてください。再発行はできません。`
  );
});

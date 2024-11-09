import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";

interface Post {
  id: string;
  author: string;
  content: string;
  imageUrl: string | null;
  timestamp: string;
  replies: string[];
  tags: string[];
}

class LainChanScraper {
  private posts: Post[] = [];
  private baseUrl: string;
  private outputFile: string;

  constructor(outputFile: string, baseUrl: string) {
    this.baseUrl = baseUrl;
    this.outputFile = outputFile;
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const musicPatterns = [/#([a-zA-Z0-9]+)/g, /\[([^\]]+)\]/g, /"([^"]+)"/g];

    for (const pattern of musicPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          tags.push(match[1].toLowerCase());
        }
      }
    }
    return [...new Set(tags)];
  }

  private async saveData() {
    const data = JSON.stringify(
      {
        posts: this.posts,
        metadata: {
          lastUpdated: new Date().toISOString(),
          totalPosts: this.posts.length,
          sourceUrl: this.baseUrl,
        },
      },
      null,
      2
    );

    await Deno.writeTextFile(this.outputFile, data);
    console.log(`Data saved to ${this.outputFile}`);
  }

  private async loadData() {
    try {
      const data = await Deno.readTextFile(this.outputFile);
      const parsed = JSON.parse(data);
      this.posts = parsed.posts;
      console.log(
        `Loaded ${this.posts.length} existing posts from ${this.outputFile}`
      );
    } catch {
      console.log(`No existing data found in ${this.outputFile}`);
      this.posts = [];
    }
  }

  public async scrape(maxPages = 5) {
    await this.loadData();
    console.log(`Starting scrape of ${this.baseUrl}`);
    console.log(`Will scrape up to ${maxPages} pages`);

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      for (let page = 1; page <= maxPages; page++) {
        const pageUrl = `${this.baseUrl}${page > 1 ? page : ""}`;
        console.log(`\nScraping page ${page}/${maxPages}: ${pageUrl}`);

        const browserPage = await browser.newPage();
        await browserPage.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        );

        try {
          await browserPage.goto(pageUrl, {
            waitUntil: "networkidle0",
            timeout: 30000,
          });
          const html = await browserPage.content();
          const document = new DOMParser().parseFromString(html, "text/html");

          if (!document) {
            throw new Error("Failed to parse HTML");
          }

          const posts = document.querySelectorAll(".post");
          console.log(`Found ${posts.length} posts on page ${page}`);

          let newPostsCount = 0;
          for (const post of posts) {
            try {
              const id = post.getAttribute("id")?.replace("post-", "") ?? "";
              const author =
                post.querySelector(".name")?.textContent?.trim() ?? "Anonymous";
              const content =
                post.querySelector(".body")?.textContent?.trim() ?? "";
              const timestamp =
                post.querySelector(".time")?.textContent?.trim() ?? "";

              const imageElement = post.querySelector(".file > a");
              const imageUrl = imageElement
                ? new URL(
                    imageElement.getAttribute("href") || "",
                    this.baseUrl
                  ).toString()
                : null;

              const replyLinks = post.querySelectorAll(".body a.post-reply");
              const replies = Array.from(replyLinks)
                .map((link) => link.getAttribute("data-id") ?? "")
                .filter((id) => id !== "");

              const tags = this.extractTags(content);

              // 重複チェック
              if (!this.posts.some((p) => p.id === id)) {
                this.posts.push({
                  id,
                  author,
                  content,
                  imageUrl,
                  timestamp,
                  replies,
                  tags,
                });
                newPostsCount++;
              }

              // 10投稿ごとに保存
              if (this.posts.length % 10 === 0) {
                await this.saveData();
              }
            } catch (error) {
              console.error(`Error processing post: ${error}`);
            }
          }

          console.log(`Added ${newPostsCount} new posts from page ${page}`);
        } catch (error) {
          console.error(`Error scraping page ${page}: ${error}`);
        } finally {
          await browserPage.close();
        }

        // ページ間で待機
        if (page < maxPages) {
          console.log("Waiting 2 seconds before next page...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // 最終保存
      await this.saveData();
    } finally {
      await browser.close();
    }
  }

  public getStats() {
    const stats = {
      totalPosts: this.posts.length,
      uniqueAuthors: new Set(this.posts.map((p) => p.author)).size,
      popularTags: [] as { tag: string; count: number }[],
      mostActiveThreads: [] as { id: string; replyCount: number }[],
      lastUpdated: new Date().toISOString(),
    };

    // タグの集計
    const tagCounts = new Map<string, number>();
    this.posts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    stats.popularTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // リプライの集計
    const replyCounts = new Map<string, number>();
    this.posts.forEach((post) => {
      post.replies.forEach((replyId) => {
        replyCounts.set(replyId, (replyCounts.get(replyId) || 0) + 1);
      });
    });

    stats.mostActiveThreads = Array.from(replyCounts.entries())
      .map(([id, replyCount]) => ({ id, replyCount }))
      .sort((a, b) => b.replyCount - a.replyCount)
      .slice(0, 5);

    return stats;
  }

  public searchPosts(query: string): Post[] {
    const lowerQuery = query.toLowerCase();
    return this.posts
      .filter(
        (post) =>
          post.content.toLowerCase().includes(lowerQuery) ||
          post.author.toLowerCase().includes(lowerQuery) ||
          post.tags.some((tag) => tag.includes(lowerQuery))
      )
      .slice(0, 20);
  }
}

// コマンドライン引数の処理
const flags = parse(Deno.args, {
  string: ["url", "output", "search"],
  number: ["pages"],
  default: {
    url: "https://lainchan.org/music/",
    output: "scraped_data.json",
    pages: 3,
  },
});

async function main() {
  try {
    console.log("\n=== Web Scraper Settings ===");
    console.log(`URL: ${flags.url}`);
    console.log(`Output file: ${flags.output}`);
    console.log(`Pages to scrape: ${flags.pages}`);
    console.log("==========================\n");

    const scraper = new LainChanScraper(flags.output, flags.url);

    // スクレイピング実行
    await scraper.scrape(flags.pages);

    // 統計情報を表示
    console.log("\n=== Statistics ===");
    const stats = scraper.getStats();
    console.log(JSON.stringify(stats, null, 2));

    // 検索クエリが指定されている場合は検索を実行
    if (flags.search) {
      console.log(`\n=== Search Results for "${flags.search}" ===`);
      const searchResults = scraper.searchPosts(flags.search);
      console.log(JSON.stringify(searchResults, null, 2));
    }
  } catch (error) {
    console.error("Fatal error:", error);
    Deno.exit(1);
  }
}

// スクリプト実行
if (import.meta.main) {
  main();
}

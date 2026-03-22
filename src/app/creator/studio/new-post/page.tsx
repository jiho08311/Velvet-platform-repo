"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PostStatus = "draft" | "published";
type PostVisibility = "public" | "subscribers" | "paid";

type CreatePostResponse = {
  creatorUsername?: string;
  error?: string;
};

export default function NewPostPage() {
  const router = useRouter();

  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<PostStatus>("published");
  const [visibility, setVisibility] = useState<PostVisibility>("subscribers");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("text", text);
      formData.append("status", status);
      formData.append("visibility", visibility);

      if (visibility === "paid") {
        formData.append("price", price);
      }

      if (files) {
        for (const file of Array.from(files)) {
          formData.append("files", file);
        }
      }

      const response = await fetch("/api/post/create", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as CreatePostResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create post");
      }

      if (!data.creatorUsername) {
        throw new Error("Missing creator username");
      }

      router.push(`/creator/${data.creatorUsername}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create post"
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <h1 className="text-xl font-semibold">New Post</h1>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="text" className="text-sm text-white/80">
              Text
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={8}
              placeholder="Write your post..."
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="status" className="text-sm text-white/80">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as PostStatus)
                }
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="visibility" className="text-sm text-white/80">
                Visibility
              </label>
              <select
                id="visibility"
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as PostVisibility)
                }
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="public">Public</option>
                <option value="subscribers">Subscribers</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {visibility === "paid" ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="price" className="text-sm text-white/80">
                Price
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="9.99"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <label htmlFor="files" className="text-sm text-white/80">
              Media
            </label>
            <input
              id="files"
              type="file"
              multiple
              onChange={(event) => setFiles(event.target.files)}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-400">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Create post"}
          </button>
        </form>
      </section>
    </main>
  );
}
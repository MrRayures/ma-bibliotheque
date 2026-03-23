import type { Book, BookType } from "../types/library";

const TYPE_LABELS: Record<BookType, string> = {
  comics: "Comics",
  manga: "Manga",
  bd: "BD",
};

const TYPE_BADGE: Record<BookType, string> = {
  comics: "bg-blue-100 text-blue-700",
  manga: "bg-purple-100 text-purple-700",
  bd: "bg-amber-100 text-amber-700",
};

const TYPE_PLACEHOLDER: Record<BookType, string> = {
  comics: "from-blue-100 to-blue-200 text-blue-400",
  manga: "from-purple-100 to-purple-200 text-purple-400",
  bd: "from-amber-100 to-amber-200 text-amber-400",
};

export function createBookCard(
  book: Book,
  coverUrl: string | null,
): HTMLElement {
  const article = document.createElement("article");
  article.className =
    "flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-md";

  const coverWrapper = document.createElement("div");
  coverWrapper.className = "relative aspect-[2/3] bg-neutral-100";

  if (coverUrl) {
    const img = document.createElement("img");
    img.src = coverUrl;
    img.alt = `Couverture de ${book.title}`;
    img.width = 200;
    img.height = 300;
    img.loading = "lazy";
    img.className = "h-full w-full object-cover";
    coverWrapper.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = `flex h-full w-full items-center justify-center bg-gradient-to-br ${TYPE_PLACEHOLDER[book.type]}`;
    const letter = document.createElement("span");
    letter.className = "text-4xl font-bold";
    letter.setAttribute("aria-hidden", "true");
    letter.textContent = (book.title[0] ?? "?").toUpperCase();
    placeholder.appendChild(letter);
    coverWrapper.appendChild(placeholder);
  }

  if (book.status === "missing") {
    const overlay = document.createElement("div");
    overlay.className =
      "absolute inset-0 flex items-center justify-center bg-black/50";
    const badge = document.createElement("span");
    badge.className =
      "rounded bg-red-500 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white";
    badge.textContent = "Manquant";
    overlay.appendChild(badge);
    coverWrapper.appendChild(overlay);
  }

  const info = document.createElement("div");
  info.className = "flex flex-1 flex-col gap-1 p-3";

  const titleRow = document.createElement("div");
  titleRow.className = "flex items-start justify-between gap-2";

  const title = document.createElement("h2");
  title.className =
    "line-clamp-2 text-sm font-semibold leading-tight text-neutral-900";
  title.textContent = book.title;

  const typeBadge = document.createElement("span");
  typeBadge.className = `shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[book.type]}`;
  typeBadge.textContent = TYPE_LABELS[book.type];

  titleRow.appendChild(title);
  titleRow.appendChild(typeBadge);

  const authors = document.createElement("p");
  authors.className = "text-xs text-neutral-500";
  authors.textContent = book.authors.join(", ");

  info.appendChild(titleRow);
  info.appendChild(authors);

  if (book.collection) {
    const vol = document.createElement("p");
    vol.className = "text-xs text-neutral-400";
    vol.textContent = `Vol.\u00a0${book.collection.volume}`;
    info.appendChild(vol);
  }

  article.appendChild(coverWrapper);
  article.appendChild(info);

  return article;
}

export function createBookListItem(
  book: Book,
  coverUrl: string | null,
  searchValue: string,
): HTMLLIElement {
  const li = document.createElement("li");
  li.dataset.search = searchValue;
  li.appendChild(createBookCard(book, coverUrl));
  return li;
}

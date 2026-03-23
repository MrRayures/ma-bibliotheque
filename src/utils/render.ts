import type { Book } from '../types/library';

export function createBookCard(book: Book, coverUrl: string | null): HTMLElement {
  const article = document.createElement('article');
  article.className =
    'relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-neutral-800 transition-transform hover:scale-[1.02] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900';
  article.setAttribute('aria-label', book.title);
  article.tabIndex = 0;

  if (coverUrl) {
    const img = document.createElement('img');
    img.src = coverUrl;
    img.alt = '';
    img.width = 200;
    img.height = 200;
    img.loading = 'lazy';
    img.className = 'h-full w-full object-cover';
    article.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'flex h-full w-full items-center justify-center';
    const letter = document.createElement('span');
    letter.className = 'text-3xl font-bold text-neutral-500';
    letter.setAttribute('aria-hidden', 'true');
    letter.textContent = (book.title[0] ?? '?').toUpperCase();
    placeholder.appendChild(letter);
    article.appendChild(placeholder);
  }

  const overlay = document.createElement('div');
  overlay.className =
    'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2.5 pb-2.5 pt-10';

  const titleEl = document.createElement('p');
  titleEl.className = 'line-clamp-2 text-xs font-semibold leading-snug text-white';
  titleEl.textContent = book.title;
  overlay.appendChild(titleEl);

  if (book.collection) {
    const meta = document.createElement('p');
    meta.className = 'mt-0.5 truncate text-[10px] leading-tight text-white/70';
    meta.textContent = `${book.collection.name}\u00a0· T.\u00a0${book.collection.volume}`;
    overlay.appendChild(meta);
  }

  article.appendChild(overlay);
  return article;
}

export function createBookListItem(
  book: Book,
  coverUrl: string | null,
  searchValue: string,
  isLoggedIn: boolean,
): HTMLLIElement {
  const li = document.createElement('li');
  li.dataset.search = searchValue;
  li.dataset.bookId = book.id;

  const card = createBookCard(book, coverUrl);

  const openDialog = () => {
    document.dispatchEvent(
      new CustomEvent('open-book-dialog', { detail: { book, coverUrl, isLoggedIn } }),
    );
  };

  card.addEventListener('click', openDialog);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDialog();
    }
  });

  li.appendChild(card);
  return li;
}

import type { Book } from '../types/library';

export function createBookCard(book: Book, coverUrl: string | null): HTMLElement {
  const article = document.createElement('article');
  article.className =
    'flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-md';

  const coverWrapper = document.createElement('div');
  coverWrapper.className = 'relative aspect-[2/3] bg-neutral-100';

  if (coverUrl) {
    const img = document.createElement('img');
    img.src = coverUrl;
    img.alt = `Couverture de ${book.title}`;
    img.width = 200;
    img.height = 300;
    img.loading = 'lazy';
    img.className = 'h-full w-full object-cover';
    coverWrapper.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className =
      'flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200';
    const letter = document.createElement('span');
    letter.className = 'text-4xl font-bold text-neutral-400';
    letter.setAttribute('aria-hidden', 'true');
    letter.textContent = (book.title[0] ?? '?').toUpperCase();
    placeholder.appendChild(letter);
    coverWrapper.appendChild(placeholder);
  }

  const info = document.createElement('div');
  info.className = 'flex flex-1 flex-col gap-1 p-3';

  const title = document.createElement('h2');
  title.className = 'line-clamp-2 text-sm font-semibold leading-tight text-neutral-900';
  title.textContent = book.title;

  info.appendChild(title);

  if (book.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.className = 'line-clamp-1 text-xs text-neutral-500 italic';
    subtitle.textContent = book.subtitle;
    info.appendChild(subtitle);
  }

  const authors = document.createElement('p');
  authors.className = 'text-xs text-neutral-500';
  authors.textContent = book.authors.join(', ');

  info.appendChild(authors);

  if (book.collection) {
    const vol = document.createElement('p');
    vol.className = 'text-xs text-neutral-400';
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
  isLoggedIn: boolean,
): HTMLLIElement {
  const li = document.createElement('li');
  li.dataset.search = searchValue;

  const wrapper = document.createElement('div');
  wrapper.className = 'relative';
  wrapper.appendChild(createBookCard(book, coverUrl));

  if (isLoggedIn) {
    const actions = document.createElement('div');
    actions.className = 'absolute top-1.5 right-1.5 flex gap-1';

    const editLink = document.createElement('a');
    editLink.href = `/ajouter?id=${book.id}`;
    editLink.className =
      'flex h-6 w-6 items-center justify-center rounded bg-white/90 text-neutral-500 shadow-sm hover:bg-white hover:text-neutral-900';
    editLink.setAttribute('aria-label', `Modifier ${book.title}`);
    editLink.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.dataset.deleteId = book.id;
    deleteBtn.className =
      'flex h-6 w-6 items-center justify-center rounded bg-white/90 text-neutral-500 shadow-sm hover:bg-red-50 hover:text-red-600';
    deleteBtn.setAttribute('aria-label', `Supprimer ${book.title}`);
    deleteBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;

    actions.appendChild(editLink);
    actions.appendChild(deleteBtn);
    wrapper.appendChild(actions);
  }

  li.appendChild(wrapper);
  return li;
}

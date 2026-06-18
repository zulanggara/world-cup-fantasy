// Lightweight searchable dropdown (select2-style) with no dependencies.
// SearchableSelect.create(container, { options: [{value, label}], value, placeholder, noResultsText, onChange })
// returns { getValue, setValue, setOptions, destroy }.
window.SearchableSelect = (function () {
  function create(container, opts) {
    const wrap = document.createElement('div');
    wrap.className = 'ssel';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ssel-input';
    input.placeholder = opts.placeholder || '';
    input.autocomplete = 'off';

    const list = document.createElement('div');
    list.className = 'ssel-list';

    wrap.appendChild(input);
    wrap.appendChild(list);
    container.appendChild(wrap);

    let options = opts.options || [];
    let currentValue = opts.value ?? '';
    let highlightIndex = -1;
    let filtered = options;

    function labelForValue(v) {
      if (v === '' || v == null) return '';
      const found = options.find((o) => String(o.value) === String(v));
      return found ? found.label : '';
    }

    function setValue(v, fireChange) {
      currentValue = v;
      input.value = labelForValue(v);
      if (fireChange && opts.onChange) opts.onChange(v);
    }

    function renderList() {
      list.innerHTML = '';
      if (!filtered.length) {
        const empty = document.createElement('div');
        empty.className = 'ssel-empty';
        empty.textContent = opts.noResultsText || 'No results';
        list.appendChild(empty);
        return;
      }
      filtered.slice(0, 50).forEach((opt, i) => {
        const item = document.createElement('div');
        item.className = 'ssel-item' + (i === highlightIndex ? ' highlight' : '');
        item.textContent = opt.label;
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          setValue(opt.value, true);
          closeList();
        });
        list.appendChild(item);
      });
    }

    function openList() {
      const q = input.value.trim().toLowerCase();
      filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
      highlightIndex = -1;
      renderList();
      list.classList.add('open');
    }

    function closeList() {
      list.classList.remove('open');
    }

    input.addEventListener('focus', () => {
      input.select();
      openList();
    });
    input.addEventListener('input', openList);
    input.addEventListener('keydown', (e) => {
      if (!list.classList.contains('open')) {
        if (e.key === 'ArrowDown') openList();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightIndex = Math.min(highlightIndex + 1, filtered.length - 1);
        renderList();
        list.children[highlightIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightIndex = Math.max(highlightIndex - 1, 0);
        renderList();
        list.children[highlightIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          setValue(filtered[highlightIndex].value, true);
          closeList();
          input.blur();
        }
      } else if (e.key === 'Escape') {
        closeList();
        input.blur();
      }
    });
    input.addEventListener('blur', () => {
      // Defer so a mousedown on a list item registers before we discard it.
      setTimeout(() => {
        closeList();
        input.value = labelForValue(currentValue);
      }, 120);
    });

    setValue(currentValue, false);

    return {
      getValue: () => currentValue,
      setValue: (v) => setValue(v, false),
      setOptions: (newOptions) => { options = newOptions; },
      destroy: () => wrap.remove(),
    };
  }

  return { create };
})();

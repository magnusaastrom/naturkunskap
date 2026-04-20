/* =========================================================
   Instuderingsfrågor – Kemisk bindning (NK2)
   (rensad version, samma upplägg som NK1b-genetik)
   ========================================================= */
(() => {
  const STORAGE_KEY = 'nk2_kemisk_bindning_state_v1';
  const VALID_LEVELS = new Set(['can', 'unsure', 'cannot']);

  const AREA_LABELS = {
    atom: 'Atom & periodiska systemet',
    model: 'Atommodellens historia',
    particles: 'Molekyler & joner',
    intra: 'Intramolekylära bindningar',
    en: 'Elektronegativitet & polaritet',
    inter: 'Intermolekylära bindningar'
  };

  const SKILL_MAP = {
    atom: ['q1', 'q2', 'q3'],
    model: ['q4', 'q5', 'q6'],
    particles: ['q7', 'q8', 'q9'],
    intra: ['q10', 'q11'],
    en: ['q13', 'q14', 'q15'],
    inter: ['q16', 'q17', 'q18']
  };

  const run = () => initStudyPage();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  function initStudyPage() {
    const questionCards = [...document.querySelectorAll('.question-card[id][data-area]')];
    const levelButtons = [...document.querySelectorAll('.level-btn[data-question][data-level]')];

    // Kör bara på instuderingssidan
    if (!questionCards.length || !levelButtons.length) return;

    injectRuntimeStyles();

    const questionIds = new Set(questionCards.map(card => card.id));
    const state = loadState(questionIds);

    levelButtons.forEach(button => {
      button.addEventListener('click', () => {
        const qid = button.dataset.question;
        const level = button.dataset.level;

        if (!questionIds.has(qid)) return;
        if (!VALID_LEVELS.has(level)) return;

        // Klick på redan vald status = avmarkera
        if (state[qid] === level) delete state[qid];
        else state[qid] = level;

        saveState(state);
        updateAll();
      });
    });

// Reset-knapp (rensar sparad självskattning)
const resetButton = document.querySelector('[data-study-reset]');
if (resetButton) {
  resetButton.addEventListener('click', () => {
    // Rensa state-objektet
    Object.keys(state).forEach(key => delete state[key]);
    // Ta bort från localStorage
    localStorage.removeItem(STORAGE_KEY);
    // Uppdatera UI direkt
    updateAll();
  });
}

    updateAll();

    function updateAll() {
      updateQuestionButtons(questionCards, levelButtons, state);
      updateProgress(questionCards, state);
      updateAreaChips(questionCards, state);
      updateSkillChecklist(state);
      updateMaterialRecommendations(questionCards, state);
    }
  }

  function loadState(validIds) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};

      const cleaned = {};
      Object.entries(parsed).forEach(([qid, level]) => {
        if (!validIds.has(qid)) return;
        if (!VALID_LEVELS.has(level)) return;
        cleaned[qid] = level;
      });

      return cleaned;
    } catch {
      return {};
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function updateQuestionButtons(cards, buttons, state) {
    buttons.forEach(btn => {
      const qid = btn.dataset.question;
      const level = btn.dataset.level;
      const selected = state[qid] === level;

      btn.setAttribute('aria-pressed', String(selected));
      btn.classList.toggle('is-can', selected && level === 'can');
      btn.classList.toggle('is-unsure', selected && level === 'unsure');
      btn.classList.toggle('is-cannot', selected && level === 'cannot');
    });

    cards.forEach(card => {
      const level = state[card.id];
      card.classList.remove('state-can', 'state-unsure', 'state-cannot');
      if (level === 'can') card.classList.add('state-can');
      if (level === 'unsure') card.classList.add('state-unsure');
      if (level === 'cannot') card.classList.add('state-cannot');
    });
  }

  function updateProgress(cards, state) {
    const total = cards.length;
    const answered = cards.filter(card => VALID_LEVELS.has(state[card.id])).length;
    const percent = total ? Math.round((answered / total) * 100) : 0;

    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');

    if (progressText) progressText.textContent = `${answered} / ${total}`;
    if (progressFill) progressFill.style.width = `${percent}%`;
  }

  function groupQuestionIdsByArea(cards) {
    return cards.reduce((acc, card) => {
      const area = card.dataset.area;
      (acc[area] ||= []).push(card.id);
      return acc;
    }, {});
  }

  function summarise(ids, state) {
    const stats = { total: ids.length, answered: 0, can: 0, unsure: 0, cannot: 0 };
    ids.forEach(id => {
      const level = state[id];
      if (!VALID_LEVELS.has(level)) return;
      stats.answered++;
      stats[level]++;
    });
    return stats;
  }

  function deriveAreaStatus(stats) {
    if (stats.answered === 0) return 'idle';
    if (stats.cannot >= 2) return 'cannot';
    if (stats.cannot >= 1 || stats.unsure >= 1 || stats.answered < stats.total) return 'unsure';
    return 'can';
  }

  function updateAreaChips(cards, state) {
    const groups = groupQuestionIdsByArea(cards);

    document.querySelectorAll('.overview-chip[data-area-summary]').forEach(chip => {
      const area = chip.dataset.areaSummary;
      const ids = groups[area] || [];
      const stats = summarise(ids, state);
      const status = deriveAreaStatus(stats);

      const dot = chip.querySelector('.overview-dot');
      if (dot) {
        dot.classList.remove('idle', 'can', 'unsure', 'cannot');
        dot.classList.add(status);
      }

      let countEl = chip.querySelector('.chip-count');
      if (!countEl) {
        countEl = document.createElement('span');
        countEl.className = 'chip-count';
        chip.appendChild(countEl);
      }
      countEl.textContent = `${stats.answered}/${stats.total}`;
      chip.title = `${AREA_LABELS[area] || area}: ${stats.answered}/${stats.total}`;
    });
  }

  function deriveSkillStatus(stats) {
    if (stats.answered === 0) return 'idle';
    if (stats.cannot >= Math.max(1, Math.ceil(stats.total / 2))) return 'cannot';
    if (stats.cannot > 0 || stats.unsure > 0 || stats.answered < stats.total) return 'unsure';
    return 'can';
  }

  function buildSkillStatusText(status, stats) {
    const suffix = stats.total > 1 ? ` · ${stats.answered}/${stats.total}` : '';
    if (status === 'can') return `Kan detta${suffix}`;
    if (status === 'unsure') return `Osäker${suffix}`;
    if (status === 'cannot') return `Kan inte alls${suffix}`;
    return 'Inte bedömt';
  }

  function updateSkillChecklist(state) {
    document.querySelectorAll('.check-item[data-skill]').forEach(item => {
      const skill = item.dataset.skill;
      const ids = SKILL_MAP[skill] || [];
      const stats = summarise(ids, state);
      const status = deriveSkillStatus(stats);

      const stateEl = item.querySelector('.check-state');
      if (stateEl) stateEl.textContent = buildSkillStatusText(status, stats);
    });
  }

  function updateMaterialRecommendations(cards, state) {
    const materialBody = document.querySelector('#materialtips .mini-card-body');
    const tipItems = [...document.querySelectorAll('#materialtips .tip-item[data-material-area]')];
    if (!materialBody || !tipItems.length) return;

    let summaryBox = materialBody.querySelector('.reco-summary');
    if (!summaryBox) {
      summaryBox = document.createElement('div');
      summaryBox.className = 'reco-summary';
      materialBody.insertBefore(summaryBox, materialBody.firstChild);
    }

    const groups = groupQuestionIdsByArea(cards);
    const ranking = Object.entries(groups)
      .map(([area, ids]) => {
        const stats = summarise(ids, state);
        const score = (stats.cannot * 3) + (stats.unsure * 1);
        return { area, label: AREA_LABELS[area] || area, stats, score };
      })
      .sort((a, b) => b.score - a.score);

    const top = ranking.filter(r => r.score > 0).slice(0, 3);

    if (!top.length) {
      summaryBox.innerHTML = `
        <div class="reco-title">Materialtips</div>
        <p class="reco-text">Markera frågor som Osäker eller Kan inte alls för att få rekommendationer här.</p>
      `;
      // återställ ordning
      tipItems.forEach(item => (item.style.order = ''));
      return;
    }

    summaryBox.innerHTML = `
      <div class="reco-title">Börja med detta</div>
      <ul class="reco-list">
        ${top
          .map(t => `<li><strong>${t.label}</strong> – ${t.stats.cannot} röd, ${t.stats.unsure} gul</li>`)
          .join('')}
      </ul>
    `;

    tipItems.forEach(item => {
      const area = item.dataset.materialArea;
      const idx = top.findIndex(t => t.area === area);
      item.style.order = idx === -1 ? '99' : String(idx);
    });
  }

  function injectRuntimeStyles() {
    if (document.getElementById('study-runtime-styles')) return;
    const style = document.createElement('style');
    style.id = 'study-runtime-styles';
    style.textContent = `
      .level-btn.is-can{border-color:rgba(52,211,153,.42)!important;background:rgba(52,211,153,.16)!important;color:#9ef0cb!important;}
      .level-btn.is-unsure{border-color:rgba(251,191,36,.42)!important;background:rgba(251,191,36,.16)!important;color:#ffd977!important;}
      .level-btn.is-cannot{border-color:rgba(251,113,133,.42)!important;background:rgba(251,113,133,.16)!important;color:#fca3b2!important;}
      .question-card.state-can{border-color:rgba(52,211,153,.34)!important;}
      .question-card.state-unsure{border-color:rgba(251,191,36,.34)!important;}
      .question-card.state-cannot{border-color:rgba(251,113,133,.34)!important;}
      .overview-dot.idle{background:rgba(255,255,255,.24)!important;}
      .overview-dot.can{background:var(--green,#34d399)!important;}
      .overview-dot.unsure{background:var(--yellow,#fbbf24)!important;}
      .overview-dot.cannot{background:var(--red,#fb7185)!important;}
      .chip-count{margin-left:4px;font-weight:800;opacity:.85;}
      .reco-summary{margin-bottom:14px;padding:12px 14px;border:1px solid rgba(45,212,191,.2);background:rgba(45,212,191,.08);border-radius:12px;}
      .reco-title{font-weight:800;margin-bottom:8px;color:var(--text,#e8f0fb);}
      .reco-text{margin:0;color:var(--muted,#9fb2c9);line-height:1.65;font-size:.88rem;}
      .reco-list{margin:0;padding-left:18px;color:var(--muted,#9fb2c9);line-height:1.65;font-size:.88rem;}
    `;
    document.head.appendChild(style);
  }
})();
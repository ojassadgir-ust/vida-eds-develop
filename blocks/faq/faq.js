export default function decorate(block) {
  const rows = [...block.children];

  /*
   * Expected structure:
   *
   * Row 1: Heading
   * Row 2: Link
   * Row 3 onwards: FAQ items
   *
   * If your Universal Editor model creates a different structure,
   * keep the FAQ item detection based on the classes below.
   */

  block.classList.add('faq');

  // Create the main FAQ content wrapper
  const faqContent = document.createElement('div');
  faqContent.className = 'faq-content';

  // Create FAQ list
  const faqList = document.createElement('div');
  faqList.className = 'faq-list';

  /*
   * Find FAQ items.
   *
   * Each FAQ item should contain:
   *   - Question
   *   - Answer
   */
  const faqItems = [];

  rows.forEach((row) => {
    const cells = [...row.children];

    // Skip empty rows
    if (!cells.length) return;

    /*
     * FAQ item:
     * first cell = question
     * second cell = answer
     */
    if (cells.length >= 2) {
      const item = document.createElement('div');
      item.className = 'faq-item';

      const questionButton = document.createElement('button');
      questionButton.className = 'faq-question';
      questionButton.type = 'button';
      questionButton.setAttribute('aria-expanded', 'false');

      const questionText = document.createElement('span');
      questionText.className = 'faq-question-text';
      questionText.innerHTML = cells[0].innerHTML;

      const chevron = document.createElement('span');
      chevron.className = 'faq-chevron';
      chevron.setAttribute('aria-hidden', 'true');

      questionButton.append(questionText);
      questionButton.append(chevron);

      const answer = document.createElement('div');
      answer.className = 'faq-answer';
      answer.innerHTML = cells[1].innerHTML;
      answer.hidden = true;

      questionButton.addEventListener('click', () => {
        const isOpen = questionButton.getAttribute('aria-expanded') === 'true';

        questionButton.setAttribute(
          'aria-expanded',
          String(!isOpen),
        );

        answer.hidden = isOpen;
        item.classList.toggle('open', !isOpen);
      });

      item.append(questionButton);
      item.append(answer);

      faqItems.push(item);
      faqList.append(item);
    }
  });

  /*
   * Show only first 6 FAQs initially.
   */
  const VISIBLE_COUNT = 6;
  let expanded = false;

  const viewMoreButton = document.createElement('button');
  viewMoreButton.className = 'faq-view-more';
  viewMoreButton.type = 'button';

  const viewMoreText = document.createElement('span');
  viewMoreText.className = 'faq-view-more-text';

  const viewMoreChevron = document.createElement('span');
  viewMoreChevron.className = 'faq-view-more-chevron';
  viewMoreChevron.setAttribute('aria-hidden', 'true');

  viewMoreButton.append(viewMoreText);
  viewMoreButton.append(viewMoreChevron);

  function updateFaqVisibility() {
    faqItems.forEach((item, index) => {
      item.hidden = !expanded && index >= VISIBLE_COUNT;
    });

    if (expanded) {
      viewMoreText.textContent = 'View less';
      viewMoreButton.classList.add('expanded');
      viewMoreButton.setAttribute('aria-expanded', 'true');
    } else {
      viewMoreText.textContent = 'View more';
      viewMoreButton.classList.remove('expanded');
      viewMoreButton.setAttribute('aria-expanded', 'false');
    }
  }

  viewMoreButton.addEventListener('click', () => {
    expanded = !expanded;
    updateFaqVisibility();
  });

  /*
   * Only show View More when there are more than 6 FAQs.
   */
  if (faqItems.length > VISIBLE_COUNT) {
    faqContent.append(faqList);
    faqContent.append(viewMoreButton);
  } else {
    faqContent.append(faqList);
  }

  /*
   * Remove the original rows after reading their content.
   */
  block.replaceChildren();

  /*
   * Add heading and link if they were provided
   * through the first two rows.
   */
  if (rows[0]) {
    const heading = document.createElement('h2');
    heading.className = 'faq-title';
    heading.innerHTML = rows[0].textContent.trim();
    block.append(heading);
  }

  if (rows[1]) {
    const linkRow = rows[1];
    const link = linkRow.querySelector('a');

    if (link) {
      const faqLink = document.createElement('a');
      faqLink.className = 'faq-link';
      faqLink.href = link.href;
      faqLink.innerHTML = `${link.textContent.trim()} <span aria-hidden="true">→</span>`;
      block.append(faqLink);
    }
  }

  block.append(faqContent);

  /*
   * Initial state:
   * 6 visible, remaining FAQs hidden.
   */
  updateFaqVisibility();
}

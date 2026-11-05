/**
 * @jest-environment jsdom
 */
jest.useFakeTimers()
import TitleSwitcher from './main'

beforeEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
})

describe('TitleSwitcher', () => {
  test('create instance with no titles', () => {
    expect.assertions(3)
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const titleSwitcher = new TitleSwitcher()
    expect(titleSwitcher.titles.length).toBe(0)
    titleSwitcher.startTitles()
    expect(warn).toHaveBeenCalledWith('No titles found for \'\'')
    expect(titleSwitcher.active).toBeFalsy()
  })

  test('detect some titles and setup type surface', () => {
    jest.spyOn(global, 'setTimeout')
    expect.assertions(9)
    document.body.innerHTML = '<div class=\'titles\'>\n' +
      '        <h4>One</h4>\n' +
      '        <h4>Two</h4>\n' +
      '    </div>'
    const titleSwitcher = new TitleSwitcher('.titles')
    expect(titleSwitcher.titles.length).toBe(2)
    titleSwitcher.startTitles({ immediatePause: true })
    expect(titleSwitcher.active).toBeFalsy()
    expect(titleSwitcher.titles.length).toBe(3)
    // typeSurface was created
    expect(titleSwitcher.titles[0].className).toBe('typeSurface')
    expect(titleSwitcher.titles[0]).toBe(titleSwitcher.typeSurface)
    expect(titleSwitcher.currentIndex).toBe(1)
    // The first title is set as current
    expect(titleSwitcher.titles[1].className).toBe('displayTitle')
    expect(titleSwitcher.titles[1].style.display).toBe('none')
    expect(titleSwitcher.titles[2].style.display).toBe('none')
  })

  test('random mode leaves exactly one title carrying the displayTitle class after the first switch', () => {
    document.body.innerHTML = '<div class=\'titles\'>\n' +
      '        <h4>One</h4>\n' +
      '        <h4>Two</h4>\n' +
      '        <h4>Three</h4>\n' +
      '        <h4>Four</h4>\n' +
      '        <h4>Five</h4>\n' +
      '        <h4>Six</h4>\n' +
      '    </div>'
    // First Math.random() call (inside startTitles): Math.round(0.5 * (6 - 2)) + 1 === 3, picking the pre-shift
    // index for 'Four' - before typeSurface's insertion shifts every title's real index up by one.
    // Second call (inside the switchTitle it triggers immediately after): Math.round(0.2 * 5) + 1 === 2, picking
    // 'Two' as the next title. Without the fix, startTitles hands switchTitle the title now sitting at the stale,
    // pre-shift index 3 ('Three') instead of the title actually tagged ('Four'), so 'displayTitle' never gets
    // removed from 'Four' while 'Two' also gets it added - two titles end up tagged instead of one.
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0.2)
    const titleSwitcher = new TitleSwitcher('.titles')
    titleSwitcher.startTitles({ isRandom: true })
    Math.random.mockRestore()

    const tagged = Array.from(titleSwitcher.titles).filter(el => el.classList.contains('displayTitle'))
    expect(tagged).toHaveLength(1)
    expect(tagged[0].textContent).toBe('Two')
  })

  test('a whitespace run where the title wraps onto a new line in the source does not stall the typing effect one tick per character', () => {
    document.body.innerHTML = '<div class=\'titles\'>\n' +
      '        <h4>Some text with a\n' +
      '            long whitespace run</h4>\n' +
      '        <h4>Two</h4>\n' +
      '    </div>'
    const titleSwitcher = new TitleSwitcher('.titles')
    titleSwitcher.startTitles({ immediatePause: true })
    titleSwitcher.typingEffect(titleSwitcher.titles[1], () => {}, titleSwitcher, true)
    jest.advanceTimersByTime(4 * 400) // initial blinks

    const rawLength = titleSwitcher.titles[1].textContent.length
    const collapsedLength = titleSwitcher.titles[1].textContent.replace(/\s+/g, ' ').length
    // sanity check: the markup above really does contain a multi-character whitespace run to collapse
    expect(rawLength).toBeGreaterThan(collapsedLength)

    // one tick per collapsed unit should be enough to finish typing - a stalled implementation would still be
    // stuck mid-whitespace-run here, several ticks short of the raw character count
    jest.advanceTimersByTime(collapsedLength * 200)
    expect(titleSwitcher.typeSurface.textContent).toBe(titleSwitcher.titles[1].textContent + '|')
  })

  test('cursor blink adds and removes cursor', () => {
    expect.assertions(7)
    document.body.innerHTML = '<div class=\'titles\'>\n' +
      '        <h4>One</h4>\n' +
      '        <h4>Two</h4>\n' +
      '    </div>'
    const titleSwitcher = new TitleSwitcher('.titles')
    expect(titleSwitcher.titles.length).toBe(2)
    titleSwitcher.startTitles({ immediatePause: true })
    titleSwitcher.cursorBlink(true, titleSwitcher)
    // Adds the cursor
    expect(titleSwitcher.typeSurface.innerHTML).toContain('|')
    expect(titleSwitcher.typeSurface.innerHTML).not.toContain('&nbsp;')
    // The cursor takes the colour of the text around it, so it shows on light and dark pages alike
    expect(titleSwitcher.typeSurface.innerHTML).toContain('color: inherit')
    expect(titleSwitcher.typeSurface.innerHTML).not.toContain('color: black')
    titleSwitcher.cursorBlink(false, titleSwitcher)
    // Removes the cursor
    expect(titleSwitcher.typeSurface.innerHTML).not.toContain('|')
    expect(titleSwitcher.typeSurface.innerHTML).toContain('&nbsp;')
  })

  test('switchTitle swaps to next titles', done => {
    expect.assertions(6)
    document.body.innerHTML = '<div class=\'titles\'>\n' +
      '        <h4>One</h4>\n' +
      '        <h4>Two</h4>\n' +
      '    </div>'
    const titleSwitcher = new TitleSwitcher('.titles')
    titleSwitcher.startTitles()
    expect(titleSwitcher.titles[1].className).toBe('displayTitle')
    expect(titleSwitcher.titles[2].className).toBeFalsy()
    titleSwitcher.typeSurface.innerHTML = 'Some content must exist here to switch titles, otherwise default to first'
    // The current title is set to first one, so the switchTitle will swap to the next title (second title)
    titleSwitcher.switchTitle(titleSwitcher.titles[1], () => {
      expect(titleSwitcher.titles[1].className).toBeFalsy()
      expect(titleSwitcher.titles[2].className).toBe('displayTitle')
    }, titleSwitcher)
    // The current title has been set to the second one, so switchTitle will overflow and swap back the first title
    titleSwitcher.switchTitle(titleSwitcher.titles[2], () => {
      expect(titleSwitcher.titles[1].className).toBe('displayTitle')
      expect(titleSwitcher.titles[2].className).toBeFalsy()
      done()
    }, titleSwitcher)
  })

  test('applies typingEffect by filling typing surface with text followed by cursor', done => {
    jest.spyOn(global, 'setTimeout')
    expect.assertions(7)
    document.body.innerHTML = '<div class=\'titles\'>\n' +
      '        <h4 style="color:purple"><strong>One</strong></h4>\n' +
      '        <h4 style="color:red"><em>Two</em></h4>\n' +
      '    </div>'
    const titleSwitcher = new TitleSwitcher('.titles')
    titleSwitcher.startTitles({ immediatePause: true })
    expect(titleSwitcher.titles[1].className).toBe('displayTitle')
    expect(titleSwitcher.titles[2].className).toBeFalsy()
    titleSwitcher.typingEffect(titleSwitcher.titles[1], () => {
      // The first title style has been applied
      expect(titleSwitcher.typeSurface.style.color).toBe(titleSwitcher.titles[1].style.color)
      // The first title has been placed with a cursor at the end
      expect(titleSwitcher.typeSurface.textContent).toBe(titleSwitcher.titles[1].textContent + '|')
    }, titleSwitcher, true)
    jest.runAllTimers()
    titleSwitcher.typingEffect(titleSwitcher.titles[2], () => {
      // The second title style has been applied
      expect(titleSwitcher.typeSurface.style.color).toBe(titleSwitcher.titles[2].style.color)
      // The second title has been placed with a cursor at the end
      expect(titleSwitcher.typeSurface.textContent).toBe(titleSwitcher.titles[2].textContent + '|')
      done()
    }, titleSwitcher, true)
    jest.runAllTimers()
    // 4 blinks to start
    // 1 timeout after blinks
    // 3 times for timeout for each letter
    // 8 blinks after complete
    // total of 16 timeouts for each title, and ran on two titles
    // grand total of 32 after running both titles
    const expectedTimes = 32
    expect(setTimeout).toHaveBeenCalledTimes(expectedTimes)
  })

  test('blinking replaces the one cursor instead of adding more', () => {
    document.body.innerHTML =
      '<div class="titles">\n' +
      '        <h4>One</h4>\n' +
      '        <h4>Two</h4>\n' +
      '    </div>'
    const titleSwitcher = new TitleSwitcher('.titles')
    titleSwitcher.startTitles({ immediatePause: true })
    titleSwitcher.typeSurface.innerHTML = 'One'
    for (let blink = 0; blink < 9; ++blink) {
      titleSwitcher.cursorBlink(blink % 2 === 0, titleSwitcher)
    }
    // 9 blinks, ending on: one cursor, showing the bar, after the untouched text
    expect(titleSwitcher.typeSurface.querySelectorAll('[data-cursor]').length).toBe(1)
    expect(titleSwitcher.typeSurface.textContent).toBe('One|')
    titleSwitcher.cursorBlink(false, titleSwitcher)
    expect(titleSwitcher.typeSurface.querySelectorAll('[data-cursor]').length).toBe(1)
    expect(titleSwitcher.typeSurface.textContent).toBe('One\u00a0')
  })

  test('applies typingEffect, including adding html', done => {
    jest.spyOn(global, 'setTimeout')
    expect.assertions(5)
    document.body.innerHTML = '<div class=\'titles\'>\n' +
      '        <h4><strong>One</strong></h4>\n' +
      '        <h4><em>Two</em></h4>\n' +
      '    </div>'
    const titleSwitcher = new TitleSwitcher('.titles')
    titleSwitcher.startTitles({ immediatePause: true })
    expect(titleSwitcher.titles[1].className).toBe('displayTitle')
    expect(titleSwitcher.titles[2].className).toBeFalsy()
    // One cursor, the bar showing (earlier versions left two empty cursor spans behind it from the blinks)
    const endCursorBlink = '<span data-cursor="" style="display: inline-block; font-weight: normal; color: inherit; text-decoration: none">|</span>'
    titleSwitcher.typingEffect(titleSwitcher.titles[1], () => {
      // The first title has been placed with a cursor at the end
      expect(titleSwitcher.typeSurface.innerHTML).toBe(titleSwitcher.titles[1].innerHTML + endCursorBlink)
    }, titleSwitcher, true)
    jest.runAllTimers()
    titleSwitcher.typingEffect(titleSwitcher.titles[2], () => {
      // The second title has been placed with a cursor at the end
      expect(titleSwitcher.typeSurface.innerHTML).toBe(titleSwitcher.titles[2].innerHTML + endCursorBlink)
      done()
    }, titleSwitcher, true)
    jest.runAllTimers()
    // 4 blinks to start
    // 1 timeout after blinks
    // 3 times for timeout for each letter
    // 8 blinks after complete
    // total of 16 timeouts for each title, and ran on two titles
    // grand total of 32 after running both titles
    expect(setTimeout).toHaveBeenCalledTimes(32)
  })

  test('typingEffect reveals inline tags as each falls under them, not only once fully typed', () => {
    document.body.innerHTML = '<div class=\'titles\'>\n' +
      '        <h4>Say <em>hello</em> world</h4>\n' +
      '        <h4>Two</h4>\n' +
      '    </div>'
    const titleSwitcher = new TitleSwitcher('.titles')
    titleSwitcher.startTitles({ immediatePause: true })
    titleSwitcher.typingEffect(titleSwitcher.titles[1], () => {}, titleSwitcher, true)
    jest.advanceTimersByTime(4 * 400)
    // partway into typing "hello" - the <em> should already be open around whatever has been typed
    // of it so far, not still plain text waiting for the whole word to finish
    jest.advanceTimersByTime('Say hel'.length * 200)
    expect(titleSwitcher.typeSurface.innerHTML).toMatch(/^Say <em>hel{1,2}<\/em>/)
    // finish typing "hello" - the full word should be wrapped, not just appended as plain text
    jest.advanceTimersByTime('lo'.length * 200)
    expect(titleSwitcher.typeSurface.innerHTML).toContain('<em>hello</em>')
  })

  test('types text that looks like HTML as text, never as markup', () => {
    // A title's text comes back from textContent unescaped; joining it into innerHTML used to turn it into real
    // elements, so this line created an <img> and ran its onerror, one letter at a time
    window.typedHtmlRan = false
    document.body.innerHTML = '<div class="titles"><h4>Safe</h4><h4></h4></div>'
    document.querySelectorAll('.titles h4')[1].textContent = '<img src=x onerror="window.typedHtmlRan = true">'
    const titleSwitcher = new TitleSwitcher('.titles')
    titleSwitcher.startTitles({ immediatePause: true })
    const title = titleSwitcher.titles[2]
    titleSwitcher.typingEffect(title, () => titleSwitcher, titleSwitcher, true)
    jest.runAllTimers()
    expect(titleSwitcher.typeSurface.querySelectorAll('img').length).toBe(0)
    expect(titleSwitcher.typeSurface.textContent).toBe(title.textContent + '|')
    expect(window.typedHtmlRan).toBe(false)
  })

  test('shows < and & in a title correctly while typing, not just at the end', () => {
    // The title's text is `x<b>y &lt;`: unescaped, `<b` opened a real <b> tag (swallowing the text) and the literal
    // `&lt;` showed as `<`
    document.body.innerHTML = '<div class="titles"><h4>One</h4><h4>x&lt;b&gt;y &amp;lt;</h4></div>'
    const titleSwitcher = new TitleSwitcher('.titles')
    titleSwitcher.startTitles({ immediatePause: true })
    const title = titleSwitcher.titles[2]
    const partials = []
    titleSwitcher.typingEffect(title, () => titleSwitcher, titleSwitcher, true)
    for (let step = 0; step < 60; ++step) {
      jest.advanceTimersByTime(50)
      partials.push(titleSwitcher.typeSurface.textContent.replace(/[|\u00a0]$/, ''))
    }
    // every partial is a prefix of the real text: nothing got swallowed as a tag or an entity
    const typed = partials.filter(Boolean)
    expect(typed.length).toBeGreaterThan(3)
    typed.forEach(partial => expect('x<b>y &lt;'.startsWith(partial)).toBe(true))
    expect(typed).toContain('x<b')
    expect(titleSwitcher.typeSurface.querySelectorAll('b').length).toBe(0)
  })
})

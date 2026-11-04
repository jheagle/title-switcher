# [title-switcher](https://www.npmjs.com/package/title-switcher)

This is the updated title-switcher which takes a simpler approach and improves many deficiencies of the original title-switcher.

Add typing effect to titles and also switch through several titles.

This project can be used as a plugin with limited set-up requirements.
No need to change the code in the title-switcher.js file except for
customization.

Add the titles to the DOM beside each other as child elements of a wrapper element (ex. div). Pass in an identifying attribute for the wrapper such as a class name. The other sample
code such as style can be used to improve how it displays.

NO need for any additional library, this runs as is. Compatible in modern browsers from IE9+.

If there are any problems contact me, but set-up should be done based on
the sample code for best results.

Live example at https://joshuaheagle.com/projects/title-switcher. Enjoy!

## Setup Example

### Sequential Titles

```html
    <div class="titles">
        <h4 style='color: #be1010; text-align: center;'>I built this <em>superb</em> <strong>plug-in</strong>.</h4>
        <h4 style='color: #1414af; text-align: right;'><strong>TitleSwitcher</strong> is great to display <em>company
            objectives</em>.</h4>
        <h4 style='color: #ff7816; text-align: center; text-decoration: underline;'>Feel free to contribute and use this
            plug-in.</h4>
        <h4 style='color: #0c710c;'>You can find more projects on <a href='https://github.com/jheagle' target='_blank'>my
            <strong>GitHub</strong></a>.</h4>
    </div>
```

```javascript
  const orderedTitles = new TitleSwitcher('.titles', 'typingEffect')
  // the first arguments is to not randomly switch, then the time between switching, and finally the delay of the effect (typing in this case)
  orderedTitles.startTitles({ isRandom: false, delaySwitch: 400, delayEffect: 100 })
```

### Random Titles

```html
    <div class='titles-random'>
        <h4>Innovate</h4>
        <h4>Create</h4>
        <h4>Connect</h4>
        <h4>Socialise</h4>
        <h4>Collaborate</h4>
        <h4>Build</h4>
        <h4>Organise</h4>
        <h4>Broadcast</h4>
    </div>
```

```javascript
  const randomTitles = new TitleSwitcher('.titles-random', 'typingEffect')
  // set to random title switching, then defaults are 400 and 200 milliseconds for switch/effects
  randomTitles.startTitles({ isRandom: true })
```

## Documentation

The reference for the `TitleSwitcher` class is in [`docs/`](https://joshuaheagle.com/projects/title-switcher/docs/index.html) (or open `docs/index.html` locally), generated from the TypeScript source in `src/main.ts`.


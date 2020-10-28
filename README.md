## Components

### Atoms

#### Button

HTML Element: `button` or `a` 

Slot: No

| Prop        | Type    | Default | Required | Description                                                  |
| ----------- | ------- | ------- | -------- | ------------------------------------------------------------ |
| `secondary` | boolean | `false` | N        | Applies secondary styling to the button which overrides the default primary styling. |
| `tertiary`  | boolean | `false` | N        | Applies tertiary styling to the button which overrides both primary and secondary styling. |
| `small`     | boolean | `false` | N        | Applies styling which reduces both the `font-size` and overall footprint of the element. |
| `href`      | string  |         | N        | Without the `href` the `Button` component is an HTML `button`. When adding a `href` the `Button` is created with an `a` element. |
| `style`     | string  |         | N        | Extends the default inline styles.                           |



#### Card	

HTML Element: `div`

Slot: Yes

| Prop     | Type    | Default | Required | Description                                    |
| -------- | ------- | ------- | -------- | ---------------------------------------------- |
| `shadow` | boolean | false   | N        | Adds a `box-shadow` to the element when `true` |



#### Family

HTML Element: `p`

Slot: No



#### FooterIcon

HTML Element: `div`

Slot: no

| Prop     | Type                                                         | Default    | Required | Description                                                  |
| -------- | ------------------------------------------------------------ | ---------- | -------- | ------------------------------------------------------------ |
| `icon`   | `facebook, twitter, pinterest, instagram, youtube, visa, mastercard, amex, maestro, paypal, ppcredit, giftcard` | `facebook` | Y        | Passing one of the string options to the component will render the chosen SVG icon. |
| `round`  | boolean                                                      | `false`    | N        | Renders a small icon with round border. This is the default styling of the component. |
| `square` | boolean                                                      | `false`    | N        | Renders a small icon with slight `border-radius`. Applying `true` will override `round`. |



#### Icon

HTML Element: `div`

Slot: No

| Prop         | Type                                                         | Default    | Required | Description                                                  |
| ------------ | ------------------------------------------------------------ | ---------- | -------- | ------------------------------------------------------------ |
| `cursor`     | string                                                       | `pointer`  | N        | Can be any of the available CSS `cursor` types.              |
| `small`      | boolean                                                      | `false`    | N        | Reduces the footprint of the icon.                           |
| `xsmall`     | boolean                                                      | `false`    | N        | Reduces the footprint of the icon further.                   |
| `icon`       | `close, imageSearch, notification, search, shoppingBag, arrow, toggleArrow, user, wishList` |            | Y        | Passing one of the string options to the component will render the chosen SVG icon. |
| `hover`      | boolean                                                      | `true`     | N        | Changing value to `false` will remove all CSS `:hover` effects. |
| `background` | string                                                       | `gray-100` | N        | Change the color of the `:hover` background.                 |



#### ImagePointer

HTML Element: `div`

Slot: No



#### Link

HTML Element: `a`

Slot: Yes / No

| Props    | Type    | Default | Required | Description                                                  |
| -------- | ------- | ------- | -------- | ------------------------------------------------------------ |
| `href`   | string  |         | Y        | Applies HTML `href` to element                               |
| `icon`   | boolean | `false` | N        | If `true` renders a toggle arrow in place of `<slot />`      |
| `inline` | boolean | `false` | N        | If true changes the styling to mirror standard app `p` styling with `text-decoration: underline` |



#### News

HTML Element: `p`

Slot: No



#### Price	

HTML Element: `p`

Slot: No

| Prop    | Type    | Default | Required | Description                                                  |
| ------- | ------- | ------- | -------- | ------------------------------------------------------------ |
| `price` | number  |         | Y        | Provided number is returned via the `formatPrice` function as a currency-ready string. |
| `small` | boolean | `false` | N        | Reduces the font size.                                       |



#### Rule	

HTML Element: `hr`

Slot: No



#### Section

HTML Element: `section`

Slot: Yes



#### SectionText

HTML Element: `p`

Slot: Yes



#### StatusDot

HTMLElement: `span`

Slot: No



#### Title

HTML Element: `h1`, `h2`, `h3`, `h4`, `h5`, or `h6`

Slot: Yes

| Prop   | Type                               | Default | Required | Description                                             |
| ------ | ---------------------------------- | ------- | -------- | ------------------------------------------------------- |
| `type` | `h1`, `h2`, `h3`, `h4`, `h5`, `h6` | `h1`    | N        | Returns a styled HTML element of the given `type` prop. |



### Molecules

#### HeadNotification

HTML Element: `div`

Slot: No

| Prop     | Type     | Default          | Required | Description                                                  |
| -------- | -------- | ---------------- | -------- | ------------------------------------------------------------ |
| `text`   | string   | `"Notification"` | N        | Renders within the notification bar as the main block of text. |
| `action` | `"link"` | `"link"`         | N        | Renders the `text` and icon as a link wrapped in an `a` element |
| `href`   | string   | `"Homepage"`     | N        | Provide alongside                                            |



#### ImageCard	

HTML Element: _component:_ `<Card />`

Slot: Yes

| Prop          | Type                      | Default    | Required | Description                                                  |
| ------------- | ------------------------- | ---------- | -------- | ------------------------------------------------------------ |
| `src`         | string                    |            | Y        | The `src` provided to the `img` element.                     |
| `top`         | number                    | `50`       | N        | Sets the CSS values `top` value of the `position: absolute` image in `%`. |
| `left`        | number                    | `50`       | N        | Sets the CSS values `left` value of the `position: absolute` image in `%`. |
| `orientation` | `"portrait", "landscape"` | `portrait` | N        | See below                                                    |
| `aspectRatio` | `"4:3","16:9", "1:1"`     | `4:3`      | N        | The container uses a common CSS padding hack for aspect ratio. `height: 0` and the correct amount of `padding-bottom` are added to the container. |



#### ImageOverlay

HTML Element: `div`

Slot: No

| Prop   | Type  | Default | Required | Description                                                  |
| ------ | ----- | ------- | -------- | ------------------------------------------------------------ |
| `data` | array | `[]`    | Y        | Accepts only correctly formatted objects which are passed on to the `<HoverCard />` component. |



#### LargeProductCard

HTML Element: _component:_ `<Card />`

Slot: Yes

| Prop         | Type   | Default | Required | Description                                                  |
| ------------ | ------ | ------- | -------- | ------------------------------------------------------------ |
| `title`      | string |         | Y        | Text for the `h2` element created using the `<Title />` component. |
| `buttonText` | string |         | Y        | Text for the `button` element created using the `<Button />` component. |
| `price`      | number | `null`  | Y        | A number formatted in the component.                         |



#### ProductCard

HTML Element: _component:_ `<Card />`

Slot: No

| Prop           | Type    | Default | Required | Description |
| -------------- | ------- | ------- | -------- | ----------- |
| `news`         | boolean | `false` | N        |             |
| `family`       | boolean | `false` | N        |             |
| `href`         | string  |         | Y        |             |
| `artno`        | number  |         | Y        |             |
| `title`        | string  |         | Y        |             |
| `productType`  | string  |         | Y        |             |
| `regularPrice` | number  | `0`     | N        |             |
| `price`        | number  | `0`     | Y        |             |
| `pieces`       | number  | `0`     | N        |             |



#### SearchBar	

HTML Structure:  

```html
<div>
  <form>
    <Icon />
    <input />
```

or

```html
<Icon />
```

| Prop          | Type    | Default    | Required | Description |
| ------------- | ------- | ---------- | -------- | ----------- |
| `placeholder` | string  | `"Search"` | N        |             |
| `hover`       | boolean | `false`    | N        |             |
| `noIcon`      | boolean | `false`    | N        |             |



#### SeeMoreCard

HTML Structure:

```html
<Card>
    <Link>
        <div>
            <slot />
        </div>
        <div>
            <StandardArrow />
```

| Prop   | Type   | Default | Required | Description                                                  |
| ------ | ------ | ------- | -------- | ------------------------------------------------------------ |
| `href` | string |         | Y        | `href` for the `a` element created using the `<Link />` component. |



## Organisms

### Footer

HTML Structure:

```html
<footer>
	...
</footer>
        
```



#### Header

HTML Structure:

```html
<header>
	...
</header>
```



#### HoverCard

HTML Structure:

```html
<div>
    ...
</div>
```

| Prop           | Type    | Default      | Required | Description |
| -------------- | ------- | ------------ | -------- | ----------- |
| `news`         | boolean | `false`      | Y        |             |
| `family`       | boolean | `false`      | Y        |             |
| `href`         | string  |              | Y        |             |
| `title`        | string  |              | Y        |             |
| `artno`        | number  |              | Y        |             |
| `productType`  | string  |              | Y        |             |
| `regularPrice` | number  | `0`          | Y        |             |
| `price`        | number  | `0`          | Y        |             |
| `pieces`       | string  |              | Y        |             |
| `visible`      | boolean | `false`      | Y        |             |
| `x`            | number  | `0`          | Y        |             |
| `y`            | number  | `0`          | Y        |             |
| `position`     | string  | `"top left"` | N        |             |



#### Slideshow

HTML Structure:

```html
<!-- This component will be completely rebuilt soon so I'm not going to write about it until it is :) -->
```



### Nav

#### MobileNav	

HTML Structure:

```html
<nav>
    ...
</nav>
```

| Prop     | Type    | Default   | Required | Description                                |
| -------- | ------- | --------- | -------- | ------------------------------------------ |
| `active` | boolean | `"false"` | Y        | Prompts the component to show/hide itself. |



#### MobileNavProducts

HTML Structure

```jsx
<Title />
<div>
	...
</div>
```



#### MobileNavRooms

HTML Structure

```jsx
<Title />
<div>
	...
</div>
```



### ProductPage

#### Breadcrumb

_Note: This will likely move to Atoms_

HTML Structure

```html
<ol>
   ...
</ol>
```

| Prop          | Type   | Default | Required | Description                                      |
| ------------- | ------ | ------- | -------- | ------------------------------------------------ |
| `grandparent` | string |         | Y        | Displays the name of the directory two steps up. |
| `parent`      | string |         | Y        | Displays the name of the directory one step up.  |



### Views

#### Homepage



#### ProductPage



#### Not Found


# Mapleify

![Travis](http://img.shields.io/travis/Wildhoney/Mapleify.svg?style=flat)
&nbsp;
![npm](http://img.shields.io/npm/v/mapleify.svg?style=flat)
&nbsp;
![License MIT](http://img.shields.io/badge/License-MIT-lightgrey.svg?style=flat)

* **npm:** `npm install mapleify -g`

---

![Screenshot](media/Screenshot%231.png)

## Getting Started

`Mapleify` accepts the same arguments as [`vulcanize`](https://github.com/polymer/vulcanize):

> `mapleify input.html -o output.html`

In comparing `Mapleify` to `vulcanize` &ndash; `Mapleify` supports the compilation of JSX and SASS documents. It also adds the path of the component as a `ref` attribute to the `template` element &ndash; this is crucial in maintaining the automagical nature of [`Maple`](https://github.com/Wildhoney/Maple.js) &ndash; and the reason why you would `Mapleify` &mdash; rather than `vulcanize` &mdash; your Maple apps.
# svg-parser

Take a string representing an SVG document or fragment, turn it into [HAST](https://github.com/syntax-tree/hast) JavaScript object.


## Installation

`npm install svg-parser`, or grab it from [npmcdn.com/svg-parser](https://npmcdn.com/svg-parser).


## Usage

```js
import { parse } from 'svg-parser';

const parsed = parse( `
	<svg viewBox='0 0 100 100'>
		<!-- stuff goes here... -->
	</svg>
` );
/*
{
  type: 'root',
  children: [
    {
      type: 'element',
      tagName: 'svg',
      properties: {
        viewBox: '0 0 100 100'
      },
      children: [...]
    }
  ]
}
*/
```
## Options 
```
{
  disableConversionToNumber: boolean (false)
}
```

**disableConversionToNumber** (false) - don't try convert value of property to number 
```
let svg = `<svg zeroEnd='72.120' big='1234.12345678912345' foo='bar'> </svg>`

const opt = { disableConversionToNumber:true };

const parsedWithOption = parse(svg, opt);
console.log(parsedWithOption.children[0].properties)
// { zeroEnd: '72.120', big: '1234.12345678912345', foo: 'bar' }
const parsed = parse(svg);
console.log(parsed.children[0].properties)
//{ zeroEnd: 72.12, big: 1234.1234567891233, foo: 'bar' }



```


## License

MIT

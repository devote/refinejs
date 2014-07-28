RefineJS
========

#### Powerful and flexible generator objects with the possibility of inheritance

---
This mini-library adds/expands the possibilities for objects in JavaScript or to be more precise, makes all the routine work on the objects for you. Namely:

  + **Cross-browser compatibility**
    -  You do not need to worry about the problems of implementation in different browsers, the library will do it for you.


  + **Encapsulation**
    -  Allows you to work with data and methods within an object and hide the implementation details from the user.


  + **Access methods**
    -  To access the data fields are in use special methods called accessors. Such methods return value of a field or records a new value in the field.
    
      > Have limitations in Internet Explorer 8 and earlier versions. More details about the restrictions described in the chapter "**Creating access methods**".


  + **Expansion/Override**
    -  Allows you to extend or override functionality and capabilities of existing objects. This feature is useful for example for HTML-elements that have need any additions/changes. 


  + **Inheritance (prototyping)**
    -  Simple prototype-based inheritance of one object from another object.


  + **Virtual inheritance**
    -  One of the options of multiple inheritance, although more similar of mixin. Is not an important part of the library, this feature is implemented soon for completeness (in simple words, "just in case").

  **And some other features for the convenience of working with objects in JavaScript...**

------
## Programming Interface - API
### *`refine()`* or *`refinejs()`*

> **Method to create objects.**

  + **Return value**:
  
    *type*: [*object*|*function*] - return object instance when calling the operator **new**, otherwise returns an internal constructor (function) "***refine-constructor***".
    
    **Example:**
	```js
	var foo = new refine(); // return object instance
	```
	*similar*:
	```js
	var Foo = refine(); // return refine-constructor
	var foo = new Foo(); // return object instance
	```

#### Parameters:
  1. [object] - *context*
    - Context where it will be built ***refine-constructor***. You must specify the name *cName*. 
  2. [string] - *cName*
    - A string specifying the name of ***refine-constructor***
  3. [array] - *extend*
    - An array of objects that need to expand/improve or ***refine-constructors*** from which to inherit.
  4. [object|boolean] - *options*
    - Object with options indicating the conditions of the object creation or `true` indicating that you need to create a compact object without adding extra properties are needed for the library. 
  5. [object|function] - *structure*
    - Structure of a new object or function that should return the object. Function is indicated for the implementation of encapsulation or for getting the general settings for the current object.

Examples
-------

A method for implementing an object with properties that are read-only:
```js
var Rect = refine(function(left, top, right, bottom) {
  return {
    left: {
      get: function() {
        return left|0;
      }
    },
    top: {
      get: function() {
        return top|0;
      }
    },
    right: {
      get: function() {
        return right|0;
      }
    },
    bottom: {
      get: function() {
        return bottom|0;
      }
    },
    width: {
      get: function() {
        return (right|0) - (left|0);
      }
    },
    height: {
      get: function() {
        return (bottom|0) - (top|0);
      }
    },
  }
});
```
Thus, we have a constructor `Rect()` which creates a `rect` with properties having a read-only attribute. They can not be overridden but can be read. This example illustrates how to implement the standard JavaScript *access methods*. But there are more concise and compact way:
```js
var Rect = refine(function(left, top, right, bottom) {
  return {
    "get left": left|0,
    "get top": top|0,
    "get right": right|0,
    "get bottom": bottom|0,
    "get width": (right|0) - (left|0),
    "get height": (bottom|0) - (top|0)
  }
});
```
So that the first and second example will work identically. And accordingly:
```js
var rect = new Rect(10, 20, 100, 200);

console.log(JSON.stringify(rect));
// {"left":10,"top":20,"right":100,"bottom":200,"width":90,"height":180}

// work with object
console.log(rect.width); // 90
rect.width = 40;         // override property
console.log(rect.width); // 90 - override failed, the value remains unchanged
```

## Detailed description will be available soon...

---------
# РУССКИЙ
#### Мощный и гибкий генератор объектов с возможностью наследования

---
Эта мини-библиотека добавляет/расширяет возможности для объектов в JavaScript или если быть точнее, делает всю рутинную работу над объектами за вас. А именно:

  + **Кросс-браузерность**
    -  Вам не нужно задумываться о проблемах реализации в разных браузерах, библиотека об этом подумает и сделает за вас.


  + **Инкапсуляция**
    -  Позволяет объединить данные и методы, работающие с ними в пределах объекта, и скрыть детали реализации от пользователя.


  + **Методы доступа**
    -  Для доступа к находящимся в полях данным используются специальные методы, называемые методами доступа. Такие методы либо возвращают значение того или иного поля, либо производят запись в это поле нового значения.
    
      > Создают ряд ограничений в Internet Explorer 8 и более ранних версиях. Подробнее об ограничениях будет описано в главе "**Создание методов доступа**".


  + **Расширение/Переопределение**
    -  Позволяет расширить/переопределить функционал или возможности уже существующих объектов. Данная возможность удобна например для HTML-элементов, которые нуждаются в каких-либо дополнениях/изменениях. 


  + **Наследование (прототипирование)**
    -  Обычное прототипное наследование одного объекта от другого объекта.


  + **Виртуальное наследование**
    -  Один из вариантов множественного наследования, хотя больше схожее с примесями. Не является важной частью библиотеки, данная возможность реализована скорее для полноты (простыми словами "на всякий случай").

  **И некоторые другие возможности для удобства работы с объектами в JavaScript...**

------
## Интерфейс программирования - API
### *`refine()`* или *`refinejs()`*
  
> **Основной метод, конструктор объектов.**

  + **Возвращаемое значение**:
  
    *type*: [*object*|*function*] - вернет рабочий объект при вызове метода с оператором **new**, иначе вернет внутренний конструктор (функцию) "***refine-конструктор***".
    
    **Пример:**
	```js
	var foo = new refine(); // вернет готовый объект
	```
	*аналогично выполнению*:
	```js
	var Foo = refine(); // вернет функцию конструктор
	var foo = new Foo(); // вернет готовый объект
	```

#### Параметры конструктора объектов:
  1. [object] - *context*
    - Контекст в котором будет создан ***refine-конструктор*** при условии если задано его имя *cName* 
  2. [string] - *cName*
    - Строка определяющая имя ***refine-конструктора***
  3. [array] - *extend*
    - Массив объектов которые нужно расширить/улучшить или ***refine-конструкторов*** от которых нужно наследоваться.
  4. [object|boolean] - *options*
    - Объект с опциями, указывающими об условиях создания объекта, либо `true` указывающее на то что нужно создать компактный объект, не добавляя лишних свойств, которые нужны для работы библиотеки. 
  5. [object|function] - *structure*
    - Структура создаваемого объекта, если задана функция, то она должна вернуть объект. Функция указывается для реализации Инкапсуляции и получения переданных общих настроек для текущего конструктора.

Примеры
-------

Способ реализации объекта со свойствами, доступными только для чтения:
```js
var Rect = refine(function(left, top, right, bottom) {
  return {
    left: {
      get: function() {
        return left|0;
      }
    },
    top: {
      get: function() {
        return top|0;
      }
    },
    right: {
      get: function() {
        return right|0;
      }
    },
    bottom: {
      get: function() {
        return bottom|0;
      }
    },
    width: {
      get: function() {
        return (right|0) - (left|0);
      }
    },
    height: {
      get: function() {
        return (bottom|0) - (top|0);
      }
    },
  }
});
```
Таким образом, мы имеем конструктор `Rect()` который создает объект `rect` со свойствами имеющими атрибут только чтение. Их нельзя переопределить но можно читать. Этот пример иллюстрирует стандартный JavaScript способ реализации *методов доступа*. Но есть более лаконичный и компактный способ:
```js
var Rect = refine(function(left, top, right, bottom) {
  return {
    "get left": left|0,
    "get top": top|0,
    "get right": right|0,
    "get bottom": bottom|0,
    "get width": (right|0) - (left|0),
    "get height": (bottom|0) - (top|0)
  }
});
```
Таким образом что первый что второй вариант, будут работать идентично. И соответственно вызов:
```js
var rect = new Rect(10, 20, 100, 200);

console.log(JSON.stringify(rect));
// в консоль выведет: {"left":10,"top":20,"right":100,"bottom":200,"width":90,"height":180}

// работа с объектом
console.log(rect.width); // 90
rect.width = 40;         // переопределяем свойство
console.log(rect.width); // 90 - переопределить не удалось, значение осталось неизменным
```

## Detailed description will be available soon...
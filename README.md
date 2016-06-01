Flujo de data unilateral en nuestro frontend
============================================

En este ejemplo analizarmos como funciona el flujo unilateral de data y crearemos una arquitectura bassada en "redux", la idea es entender como funciona
ese tipo de librerias de manera interna y de esta forma tener un mejor entendimiento del manejo de data de manera unilateral.
 

     < - - - < - - - < - - - - < - - - < - 
     |                                    |
     |                                    |
_ _ _ _ _ _ _      _ _ _ _ _ _       _ _ _ _ _ _
|           |      |         |       |         |
|  actions  | ---> |  store  | --->  |  views  |
|_ _ _ _ _ _|      |_ _ _ _ _|       |_ _ _ _ _|


La idea general es que el store es donde se almacena el estado de nuestra aplicacion y la unica manera 

If you want to use it in development you can use the npm script:

```
npm run watch
```

for build

```
npm run build
```

And if you want to start the server

```
npm start
```

# MywebrtcApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.3.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Deploy to 'docs' (for github pages deployment)

ng build --configuration production --output-path docs --base-href /mywebrtc-app/
cp docs/index.html docs/404.html
git add docs/*
git status
git commit -a -m "deploy"
git push origin main


## BUILD SIZE
kmoyse@kmoyse-XPS-15-9560:~/akgsworkspace/mywebrtc-app$ ng build
✔ Browser application bundle generation complete.
✔ Copying assets complete.
⠋ Generating index html...2 rules skipped due to selector errors:
  .form-floating>~label -> Did not expect successive traversals.
  .form-floating>~label -> Did not expect successive traversals.
✔ Index html generation complete.

Initial Chunk Files           | Names         |  Raw Size | Estimated Transfer Size
main.80a9f478a0c771f4.js      | main          |   1.02 MB |               228.66 kB
styles.cd7cd892905e7e38.css   | styles        | 301.18 kB |                29.84 kB
scripts.d1c00555d4694195.js   | scripts       |  58.26 kB |                14.42 kB
polyfills.5dc05d4c180782f3.js | polyfills     |  32.99 kB |                10.69 kB
runtime.39457fd9d69ed11d.js   | runtime       |   1.22 kB |               659 bytes

                              | Initial Total |   1.40 MB |               284.26 kB

Build at: 2023-12-16T18:09:15.496Z - Hash: 190a5765c2d56363 - Time: 20821ms

Warning: /home/kmoyse/akgsworkspace/mywebrtc-app/src/main.ts depends on 'mywebrtc/dist'. CommonJS or AMD dependencies can cause optimization bailouts.
For more info see: https://angular.io/guide/build#configuring-commonjs-dependencies

Warning: bundle initial exceeded maximum budget. Budget 1.00 MB was not met by 409.65 kB with a total of 1.40 MB.

TODO : migrate webrtc lib and this project to modular firebase. and retry. also retry to package library for ESnext (browser rather than commonsj.)


AFTER :

kmoyse@kmoyse-XPS-15-9560:~/akgsworkspace/mywebrtc-app$ ng build
✔ Browser application bundle generation complete.
✔ Copying assets complete.
⠋ Generating index html...2 rules skipped due to selector errors:
  .form-floating>~label -> Did not expect successive traversals.
  .form-floating>~label -> Did not expect successive traversals.
✔ Index html generation complete.

Initial Chunk Files           | Names         |  Raw Size | Estimated Transfer Size
main.98e5386632033649.js      | main          | 842.60 kB |               181.00 kB
styles.cd7cd892905e7e38.css   | styles        | 301.18 kB |                29.84 kB
scripts.d1c00555d4694195.js   | scripts       |  58.26 kB |                14.42 kB
polyfills.5dc05d4c180782f3.js | polyfills     |  32.99 kB |                10.69 kB
runtime.05d80cee4b07f5ff.js   | runtime       |   1.06 kB |               602 bytes

                              | Initial Total |   1.21 MB |               236.54 kB

Build at: 2023-12-17T12:23:36.543Z - Hash: f64a2348a87b39be - Time: 18776ms

Warning: /home/kmoyse/akgsworkspace/mywebrtc-app/src/app/MediaStreamHelper.ts depends on '@mediapipe/camera_utils'. CommonJS or AMD dependencies can cause optimization bailouts.
For more info see: https://angular.io/guide/build#configuring-commonjs-dependencies

Warning: /home/kmoyse/akgsworkspace/mywebrtc-app/src/app/MediaStreamHelper.ts depends on '@mediapipe/selfie_segmentation'. CommonJS or AMD dependencies can cause optimization bailouts.
For more info see: https://angular.io/guide/build#configuring-commonjs-dependencies

Warning: bundle initial exceeded maximum budget. Budget 1.00 MB was not met by 212.10 kB with a total of 1.21 MB.

AFTER REMOVING BLUR USING @mediapipe stuff :

kmoyse@kmoyse-XPS-15-9560:~/akgsworkspace/mywebrtc-app$ ng build
✔ Browser application bundle generation complete.
✔ Copying assets complete.
⠋ Generating index html...2 rules skipped due to selector errors:
  .form-floating>~label -> Did not expect successive traversals.
  .form-floating>~label -> Did not expect successive traversals.
✔ Index html generation complete.

Initial Chunk Files           | Names         |  Raw Size | Estimated Transfer Size
main.9174ba15566c644b.js      | main          | 790.25 kB |               164.49 kB
styles.cd7cd892905e7e38.css   | styles        | 301.18 kB |                29.84 kB
scripts.d1c00555d4694195.js   | scripts       |  58.26 kB |                14.42 kB
polyfills.5dc05d4c180782f3.js | polyfills     |  32.99 kB |                10.69 kB
runtime.745df2968b9879d0.js   | runtime       |   1.05 kB |               600 bytes

                              | Initial Total |   1.16 MB |               220.03 kB

Build at: 2023-12-17T12:28:52.429Z - Hash: 774765bf3d3f4398 - Time: 6856ms

Warning: bundle initial exceeded maximum budget. Budget 1.00 MB was not met by 159.74 kB with a total of 1.16 MB.

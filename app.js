const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const existsSync = fs.existsSync

const addTextWatermarkToImage = async function (inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
      text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    }

    image.print(font, 10, 10, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
    console.log('File successfully created!');
    startApp();

  } catch (error) {
    console.log('Something went wrong... Try again!');
  }
};


const addImageWatermarkToImage = async function (inputFile, outputFile, watermarkFile) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
    console.log('File successfully created!');
    startApp();

  } catch (error) {
    console.log('Something went wrong... Try again!');
  }
};

const prepareOutputFilename = filename => {
  const splitFilename = filename.split('.');
  splitFilename[0] = splitFilename[0] + '-with-watermark';
  const changedName = splitFilename.join('.');
  return changedName;
}

const transformImage = async function (inputFile, outputFile, changeType) {
  try {
    const image = await Jimp.read(inputFile);

    switch (changeType) {
      case 'Make image brighter':
        image.brightness(0.3)
      case 'Increase contrast':
        image.contrast(0.3)
      case 'Make image b&w':
        image.greyscale()
      case 'Invert image':
        image.invert()
    }

    await image.quality(100).writeAsync(outputFile);

  } catch (error) {
    console.log('Something went wrong... Try again!');
  }
}


const startApp = async () => {
  // Ask if user is ready
  const answer = await inquirer.prompt([{
    name: 'start',
    message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
    type: 'confirm'
  }]);

  // if answer is no, just quit the app
  if (!answer.start) process.exit();

  // ask about input file and watermark type
  const options = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
  },
  {
    name: 'changeImage',
    message: 'Do you want to make changes to the image before proceeding?',
    type: 'confirm'
  }
  ]);

  // exit with an err msg if input image path is invalid
  if (!existsSync('./img/' + options.inputImage)) {
    console.log('Something went wrong... Try again');
    process.exit();
  }

  if (options.changeImage) {
    const possibleChanges = await inquirer.prompt([
      {
        name: 'changeType',
        type: 'list',
        choices: ['Make image brighter', 'Increase contrast', 'Make image b&w', 'Invert image'],
      }
    ]);


    transformImage('./img/' + options.inputImage, './img/' + 'changed-' + options.inputImage, possibleChanges.changeType)

    // change inputImage so it uses changed image without overwriting the original one
    options.inputImage = 'changed-' + options.inputImage;
  }

  const type = await inquirer.prompt([
    {
      name: 'watermarkType',
      type: 'list',
      choices: ['Text watermark', 'Image watermark'],
    }
  ]);

  // add watermark to options object to keep it organized
  options.watermarkType = type.watermarkType;

  if (options.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
    }]);
    options.watermarkText = text.value;
    addTextWatermarkToImage('./img/' + options.inputImage, prepareOutputFilename(options.inputImage), options.watermarkText);
  }
  else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.png',
    }]);
    options.watermarkImage = image.filename;

    // exit with an err msg if watermark image path is invalid
    if (!existsSync('./img/' + options.watermarkImage)) {
      console.log('Something went wrong... Try again');
      process.exit();
    }

    addImageWatermarkToImage('./img/' + options.inputImage, prepareOutputFilename(options.inputImage), './img/' + options.watermarkImage);
  }
}


startApp()

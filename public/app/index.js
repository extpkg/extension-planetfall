const OBJECT_SATELLITE_STATION = 0;
const OBJECT_BUILDING = 1;
const OBJECT_DUNE = 2;
const OBJECT_CANYON = 3;
const OBJECT_TREE = 4;
const OBJECT_BUILDING_2 = 5;

const STAGE_TITLE = 0;
const STAGE_GAME = 1;
const STAGE_ENDING = 2;
const STAGE_OVER = 3;

const OVER_REASON_CRASH = 0;
const OVER_REASON_RUNNING_OUT_OF_FUEL = 1;

const FONT = "Courier New";

const CATLAX_DUNE_COLOR = ["#555", "#555", "#666", "#666"];
const CATLAX_CANYON_COLOR = ["#666", "#444", "#555"];
const KAPBULA_DUNE_COLOR = ["#4F4874", "#FE8265", "#AE5B72", "#905778"];
const ESKIRI_DUNE_COLOR = ["#fff", "#fff", "#D3DEE6", "#B7C9D5"];
const ESKIRI_CANYON_COLOR = ["#F9FBFB", "#B7C9D5", "#D3DEE6"];

let OS = "";

ext.runtime.getPlatformInfo().then(({ os }) => {
  OS = os;
});

const camera = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  vr: 0,
  zoom: 1,
  rotaion: 0,
  isJumping: false,
  fuel: 100,
  planet: undefined,
};

const planets = [
  {
    name: "Aolea",
    x: 0,
    y: 2020,
    radius: 2000,
    gravity: 0.05,
    color: {
      land: "#091A1E",
      atmosphere: [
        [0, "#4F3C6A"],
        [0.1, "#0E2A48"],
      ],
    },
    objects: [[30, OBJECT_SATELLITE_STATION, false]],
    bgs: [
      [2, 0, OBJECT_BUILDING, 1.75, 0.7],
      [6, 3, OBJECT_BUILDING_2, 2.75, 0.6],
      [3, 2, OBJECT_BUILDING, 2.25, 0.5],
      [6, 3, OBJECT_BUILDING_2, 3.25, 0.3],
    ],
  },
  {
    name: "Catlax",
    x: -600,
    y: -1900,
    radius: 200,
    gravity: 0.05,
    color: {
      land: "#555",
      atmosphere: [[0, "rgba(255,255,255,0.3)"]],
    },
    objects: [[200, OBJECT_SATELLITE_STATION, false]],
    bgs: [
      [40, 3, OBJECT_DUNE, 0.1, 0, ...CATLAX_DUNE_COLOR],
      [40, 10, OBJECT_DUNE, 0.1, 0, ...CATLAX_DUNE_COLOR],
      [120, 0, OBJECT_CANYON, 1, 0, ...CATLAX_CANYON_COLOR],
      [80, 10, OBJECT_CANYON, 0.5, 0, ...CATLAX_CANYON_COLOR],
    ],
  },
  {
    name: "Kapbula",
    x: 0,
    y: -12010,
    radius: 2000,
    gravity: 0.035,
    color: {
      land: "#2E284B",
      atmosphere: [
        [0, "#FF9577"],
        [0.03, "#FF6D5B"],
        [0.2, "#50456E"],
      ],
    },
    objects: [[90, OBJECT_SATELLITE_STATION, false]],
    bgs: [
      [15, 0, OBJECT_DUNE, 1, 0.9, ...KAPBULA_DUNE_COLOR],
      [5, 13, OBJECT_DUNE, 0.5, 0.85, ...KAPBULA_DUNE_COLOR],
      [7.5, 7, OBJECT_DUNE, 0.7, 0.8, ...KAPBULA_DUNE_COLOR],
      [5, 4, OBJECT_DUNE, 0.4, 0.75, ...KAPBULA_DUNE_COLOR],
    ],
  },
  {
    name: "Nadium",
    x: 12010,
    y: 0,
    radius: 2000,
    gravity: 0.03,
    color: {
      land: "#112408",
      atmosphere: [
        [0, "#29573A"],
        [0.05, "#C4D6A5"],
        [0.1, "#BBC87A"],
      ],
    },
    objects: [[0, OBJECT_SATELLITE_STATION, false]],
    bgs: [
      [3, 4, OBJECT_TREE, 2, 0.5],
      [2, 0, OBJECT_TREE, 3, 0.35],
      [3, 4, OBJECT_TREE, 2.5, 0.3],
    ],
  },
  {
    name: "Eskiri",
    x: 12010,
    y: 10010,
    radius: 1000,
    gravity: 0.05,
    color: {
      land: "#E9EEF2",
      atmosphere: [
        [0, "#EAEFF2"],
        [0.1, "#8CA9BF"],
        [0.24, "#4A5E7A"],
      ],
    },
    objects: [[0, OBJECT_SATELLITE_STATION, false]],
    bgs: [
      [20, 0, OBJECT_DUNE, 0.5, 0.9, ...ESKIRI_DUNE_COLOR],
      [20, 10, OBJECT_CANYON, 1, 0.85, ...ESKIRI_CANYON_COLOR],
      [20, 10, OBJECT_DUNE, 0.3, 0.8, ...ESKIRI_DUNE_COLOR],
    ],
  },
];

const character = {
  width: 5,
  height: 5 * 1.618,
};

const pressingKeys = {};

const objectives = {
  savedPlanets: {},
};

const radarWaves = [];

const stage = {
  code: STAGE_TITLE,
};

function transform(value, zoomRation = 1) {
  if (typeof value === "object") {
    const theta = (camera.rotaion * Math.PI) / 180;
    return {
      x:
        window.innerWidth / 2 +
        (value.x - camera.x) * Math.cos(theta) * camera.zoom * zoomRation -
        (value.y - camera.y) * Math.sin(theta) * camera.zoom * zoomRation,
      y:
        window.innerHeight / 2 +
        (value.x - camera.x) * Math.sin(theta) * camera.zoom * zoomRation +
        (value.y - camera.y) * Math.cos(theta) * camera.zoom * zoomRation,
    };
  } else {
    return value * camera.zoom * zoomRation;
  }
}

function getAngle(point1, point2) {
  const diff_x = point1.x - point2.x;
  const diff_y = point1.y - point2.y;
  let angle = (360 * Math.atan(diff_y / diff_x)) / (2 * Math.PI) - 90;
  if (diff_x < 0) angle += 180;
  else if (diff_y < 0) angle += 360;
  else angle += 360;
  return angle;
}

function getTheta(angle) {
  return (angle * Math.PI) / 180;
}

function getDistanceToPlanetSurface(planet) {
  return (
    Math.hypot(planet.x - camera.x, planet.y - camera.y) -
    planet.radius -
    character.height / 2
  );
}

function getPositionOnPlanetSurface(planet, azimuth, point) {
  const anchorTheta = ((azimuth - 90) * Math.PI) / 180;
  const anchorPosition = {
    x: planet.x + planet.radius * Math.cos(anchorTheta),
    y: planet.y + planet.radius * Math.sin(anchorTheta),
  };
  if (!point) {
    return anchorPosition;
  }

  const { x, y } = point;
  const distance = Math.hypot(x, y);
  const angle = getAngle({ x: 0, y: 0 }, { x, y }) + azimuth - 90;
  const theta = (angle * Math.PI) / 180;
  return {
    x: anchorPosition.x + distance * Math.cos(theta),
    y: anchorPosition.y + distance * Math.sin(theta),
  };
}

function transformColorStops(color, transformFunc) {
  let _color;
  if (typeof color === "string") {
    _color = color;
  } else {
    const [x1, y1, x2, y2, stops] = color;
    const { x: _x1, y: _y1 } = transformFunc(x1, y1);
    const { x: _x2, y: _y2 } = transformFunc(x2, y2);
    _color = [_x1, _y1, _x2, _y2, stops];
  }
  return _color;
}

function isAccelerating() {
  return (
    (pressingKeys[38] || pressingKeys[40]) &&
    camera.fuel > 0 &&
    (!camera.planet || getDistanceToPlanetSurface(camera.planet) > 10)
  );
}

function drawImageOnPlanet(context, transformOnPlanet, layers) {
  drawImage(
    context,
    layers.map(({ color, paths, shadow }) => ({
      shadow,
      color: transformColorStops(color, transformOnPlanet),
      paths: paths.map(([x, y]) => transformOnPlanet(x, y)),
    })),
  );
}

function drawImage(context, layers) {
  return layers.map((layer) => {
    if (layer.shadow) {
      context.shadowColor = layer.shadow[0];
      context.shadowBlur = layer.shadow[1];
    }
    context.beginPath();
    layer.paths.map(({ x, y }, index) => {
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.fillStyle =
      typeof layer.color === "string"
        ? layer.color
        : getLinearGradient(context, ...layer.color);
    context.closePath();
    context.fill();
    context.shadowBlur = 0;
  });
}

function getLinearGradient(context, x1, y1, x2, y2, stops) {
  const gradient = context.createLinearGradient(x1, y1, x2, y2);
  stops.map((args) => gradient.addColorStop(...args));
  return gradient;
}

function white(alpha) {
  return `rgba(255,255,255,${alpha})`;
}

function isNearStaelliteStation() {
  if (camera.planet) {
    const satelliteStation = camera.planet.objects.find(
      (object) => object[1] === OBJECT_SATELLITE_STATION,
    );
    const satelliteStationPosition = getPositionOnPlanetSurface(
      camera.planet,
      satelliteStation[0],
    );
    const distance = Math.hypot(
      camera.x - satelliteStationPosition.x,
      camera.y - satelliteStationPosition.y,
    );
    return distance < 20;
  } else {
    return false;
  }
}

function mapTouchEventToKeyCode({ touches }) {
  if (!touches || touches.length === 0) return;
  const [{ clientX, clientY }] = touches;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const size = width / 3;
  if (clientX < size && clientY > height - size) {
    return 37;
  } else if (clientX > size && clientX < size * 2 && clientY > height - size) {
    return 40;
  } else if (
    clientX > size &&
    clientX < size * 2 &&
    clientY > height - size * 2 &&
    clientY < height - size
  ) {
    return 38;
  } else if (clientX > size * 2 && clientY > height - size) {
    return 39;
  } else {
    return 32;
  }
}

const A = 0.1;
const AR = 0.03;

var updateCamera = () => {
  if (
    camera.planet &&
    (stage.code !== STAGE_OVER ||
      stage.reason === OVER_REASON_RUNNING_OUT_OF_FUEL)
  ) {
    updateOnPlanet();
  } else {
    updateInSpace();
  }

  camera.x += camera.vx;
  camera.y += camera.vy;
};

function updateOnPlanet() {
  const planet = camera.planet;
  const gravityAngle = getAngle(planet, camera);
  const gravityTheta = getTheta(gravityAngle);
  const cameraTheta = getTheta(camera.rotaion);
  const distance = getDistanceToPlanetSurface(planet);
  const distanceRatio = 1 - distance / planet.radius;

  if (distance <= 0) {
    camera.isJumping = false;
    camera.x -= camera.vx;
    camera.y -= camera.vy;
    camera.vx = 0;
    camera.vy = 0;
    updateFuel(0.3);
  } else {
    camera.vx -=
      planet.gravity * distanceRatio * distanceRatio * Math.sin(gravityTheta);
    camera.vy +=
      planet.gravity * distanceRatio * distanceRatio * Math.cos(gravityTheta);
  }

  camera.zoom = 1 + 4 * distanceRatio * distanceRatio * distanceRatio;
  let rDiff = 360 - gravityAngle - camera.rotaion;
  if (rDiff < 0) rDiff += 360;
  if (rDiff > 10 && rDiff < 180) {
    camera.rotaion += 10 * distanceRatio * distanceRatio;
    camera.rotaion %= 360;
  } else if (rDiff >= 180 && rDiff <= 350) {
    camera.rotaion -= 10 * distanceRatio * distanceRatio;
    camera.rotaion %= 360;
  } else {
    camera.vr = 0;
    camera.rotaion = 360 - gravityAngle;
  }

  if (rDiff < 10 || rDiff > 350) {
    const ha = 0.075 + ((2000 - planet.radius) / 2000) * 0.4;
    if (pressingKeys[37]) {
      if (distance <= 0) {
        const { x, y } = getPositionOnPlanetSurface(planet, gravityAngle - ha, {
          x: 0,
          y: -character.height / 2,
        });
        camera.x = x;
        camera.y = y;
      } else {
        camera.vx -= 0.05 * Math.cos(gravityTheta);
        camera.vy -= 0.05 * Math.sin(gravityTheta);
      }
    }
    if (pressingKeys[39]) {
      if (distance <= 0) {
        const { x, y } = getPositionOnPlanetSurface(planet, gravityAngle + ha, {
          x: 0,
          y: -character.height / 2,
        });
        camera.x = x;
        camera.y = y;
      } else {
        camera.vx += 0.05 * Math.cos(gravityTheta);
        camera.vy += 0.05 * Math.sin(gravityTheta);
      }
    }
  } else {
    if (pressingKeys[37]) {
      camera.vr += AR;
    }
    if (pressingKeys[39]) {
      camera.vr -= AR;
    }
    camera.rotaion += camera.vr;
  }

  if (pressingKeys[38]) {
    if (camera.isJumping) {
      if (distance > 10 && camera.fuel > 0) {
        camera.vx -= 0.05 * Math.sin(cameraTheta);
        camera.vy -= 0.05 * Math.cos(cameraTheta);
        updateFuel(-0.1);
      }
    } else {
      camera.isJumping = true;
      camera.vx += 1 * Math.sin(gravityTheta);
      camera.vy -= 1 * Math.cos(gravityTheta);
    }
  }

  if (pressingKeys[40]) {
    if (distance > 10) {
      if (camera.fuel > 0) {
        camera.vx += 0.05 * Math.sin(cameraTheta);
        camera.vy += 0.05 * Math.cos(cameraTheta);
        updateFuel(-0.1);
      }
    }
  }
}

function updateInSpace() {
  const cameraTheta = (camera.rotaion * Math.PI) / 180;
  if (pressingKeys[37]) {
    camera.vr += AR;
  }
  if (pressingKeys[39]) {
    camera.vr -= AR;
  }
  if (pressingKeys[38] && camera.fuel > 0) {
    camera.vx -= A * Math.sin(cameraTheta);
    camera.vy -= A * Math.cos(cameraTheta);
    updateFuel(-0.1);
  }
  if (pressingKeys[40] && camera.fuel > 0) {
    camera.vx += A * Math.sin(cameraTheta);
    camera.vy += A * Math.cos(cameraTheta);
    updateFuel(-0.1);
  }
  camera.rotaion += camera.vr;
  camera.rotaion %= 360;
  camera.rotaion += camera.rotaion < 0 ? 360 : 0;
}

function updateFuel(amount) {
  camera.fuel += amount;
  camera.fuel = Math.min(Math.max(camera.fuel, 0), 100);
}

let isPressingSpace = false;

var updateObjective = () => {
  const planet = camera.planet;
  if (pressingKeys[32] && planet) {
    if (isPressingSpace) return;
    isPressingSpace = true;
    const satelliteStation = planet.objects.find(
      (object) => object[1] === OBJECT_SATELLITE_STATION,
    );
    const satelliteStationPosition = getPositionOnPlanetSurface(
      planet,
      satelliteStation[0],
    );
    const distance = Math.hypot(
      camera.x - satelliteStationPosition.x,
      camera.y - satelliteStationPosition.y,
    );
    if (distance < 20) {
      objectives.savedPlanets[planet.name] = true;
      satelliteStation[2] = true;
    }
  } else {
    isPressingSpace = false;
  }
};

const LAYERS = [
  {
    color: "#fff",
    paths: [
      [7.2, -49.4],
      [4.8, -47],
      [-15.6, -21.8],
      [-17, -16.4],
      [-11.6, -14.8],
      [0, -19.2],
      [1, -16.4],
      [3, -15.6],
      [2.8, -14.4],
      [-3, -8.2],
      [-3.4, 9.4],
      [15.6, 10.6],
      [15.2, -7.4],
      [10.2, -14],
      [10.2, -16],
      [13.2, -15.8],
      [16.6, -18.6],
      [18.4, -25.6],
      [13.2, -29],
      [12, -32.8],
      [9.6, -34.4],
      [12.2, -43.4],
      [11.6, -46.8],
      [8.6, -50],
    ],
  },
  {
    color: "#eee",
    paths: [
      [8.5, -50],
      [9, -44.2],
      [7.4, -38],
      [3, -30.6],
      [-1.2, -25.6],
      [-6.8, -20.6],
      [-11.6, -17.4],
      [-16.8, -16.2],
      [-17, -16.4],
      [-14.6, -15.4],
      [-11.4, -14.8],
      [-9.6, -15.4],
      [-7.2, -16.4],
      [-0.2, -19],
      [4.8, -20.6],
      [8.4, -26],
      [11.6, -32.4],
      [10.4, -34.2],
      [9.8, -35.6],
      [10.6, -37.8],
      [12.2, -44.2],
      [11.5, -46.8],
      [10.2, -48.6],
      [10.2, -49],
    ],
  },
  {
    color: "#eee",
    paths: [
      [-10.8, -22.2],
      [-9.8, -36.8],
      [7.6, -40],
      [7.6, -39.2],
      [-7.4, -36.2],
      [-7.8, -34.8],
      [-1.2, -26.2],
      [-2, -25.4],
      [-8.4, -34],
      [-9.4, -34],
      [-10.2, -22.2],
    ],
  },
];

let _radius = 20;
let delta = 1;

var drawSatelliteStation = (context, transformOnPlanet, isOffline) => {
  drawImageOnPlanet(context, transformOnPlanet, LAYERS);

  const { x, y } = transformOnPlanet(-9.8, -36.8);
  const radius = transform(_radius * (isOffline ? 0.8 : 1));
  const grd = context.createRadialGradient(x, y, 0, x, y, radius);
  const color = isOffline ? [254, 0, 24] : [19, 167, 76];
  grd.addColorStop(0, "#fff");
  grd.addColorStop(0.3, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`);
  grd.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
  context.fillStyle = grd;
  context.beginPath();
  context.arc(x, y, transform(20), 0, 2 * Math.PI);
  context.fill();

  _radius += 0.01 * delta;
  if (_radius <= 15) delta = 1;
  if (_radius >= 20) delta = -1;
};

const type1 = [
  [-19.2, 10.6],
  [-19.2, 0.8],
  [-18.6, 0.4],
  [-18.6, -1.8],
  [-19.2, -1.8],
  [-19.2, -5.2],
  [-18.6, -5.2],
  [-18.6, -15.2],
  [-19.2, -15.4],
  [-19.2, -20],
  [-18.6, -20.2],
  [-18.6, -30.6],
  [-17, -32.6],
  [-15.6, -32.6],
  [-15.6, -34.6],
  [-13.8, -34.6],
  [-13.4, -32.4],
  [-10, -32],
  [-7.2, -30.4],
  [-7.2, 0.4],
  [-6.6, 0.8],
  [-7, 11],
  [-5.2, 11],
  [-5.4, -0.4],
  [-4.4, -0.2],
  [-1.2, -2.4],
  [-1, -37.2],
  [-2.4, -39],
  [-2.4, -53],
  [-1.4, -53],
  [-1.2, -54.2],
  [-1.8, -54.2],
  [-1.8, -56],
  [1, -56],
  [0.8, -59],
  [3, -61],
  [5, -61],
  [5, -63.4],
  [6.6, -63.4],
  [6.6, -60.6],
  [7.8, -60.8],
  [7.8, -62],
  [8.4, -62],
  [8.4, -60.6],
  [10.8, -60.6],
  [10.8, -56],
  [12, -55],
  [12, -53],
  [14.2, -53],
  [14.2, -51.2],
  [16.6, -51.2],
  [16.6, -43],
  [15.2, -43],
  [15.2, -43.4],
  [14.6, -43.4],
  [14.2, -34],
  [12.4, -32],
  [12.4, -27.8],
  [13.8, -26.2],
  [14, -14.4],
  [19.2, -14.4],
  [19.2, -13.2],
  [18.6, -13.2],
  [18.6, -9.4],
  [17.8, -9.6],
  [17.6, -7.4],
  [20.2, -7.4],
  [20.2, -4.8],
  [19.6, -4.8],
  [17.4, -1.4],
  [17.4, 5.6],
  [17, 10.4],
  [18, 10.4],
  [17.4, 6.4],
  [16.8, 10.6],
];

const type2 = [
  [11.6, 5.2],
  [11.6, 2.2],
  [12.2, 2],
  [12.2, -0.2],
  [11.6, -0.2],
  [11.6, -2.4],
  [10, -4.2],
  [10.2, -18.6],
  [10.8, -19],
  [11, -26.2],
  [10.2, -26.2],
  [10.4, -41.6],
  [7.8, -44.4],
  [7.8, -45.2],
  [8.8, -45.2],
  [8.8, -44.4],
  [10.6, -44.8],
  [10.6, -54.2],
  [9, -54.2],
  [8.8, -53.6],
  [8, -53.6],
  [8, -54.4],
  [9, -55.4],
  [9.2, -64.6],
  [8.4, -65.2],
  [0, -65.4],
  [-0.2, -61],
  [-0.8, -61.4],
  [-1, -55.6],
  [-2.8, -55.4],
  [-6.2, -51.6],
  [-6, -40.4],
  [-6, -41.2],
  [-7.2, -40.4],
  [-7.6, -32.4],
  [-6.6, -31],
  [-5.6, -17.2],
  [-8.4, -16.2],
  [-8, -0.2],
  [-8.6, -0.2],
  [-8.6, -5.8],
  [-9.8, -5.4],
  [-10, -0.2],
  [-10.2, -0.2],
  [-11.2, -2.4],
  [-11.2, 8.4],
  [11.8, 9.2],
];

let frame = 0;

var drawBuilding =
  (type) =>
  (context, transformOnPlanet, [azimuth, scale]) => {
    frame = (frame + 1) % 100;

    drawImageOnPlanet(context, transformOnPlanet, [
      {
        color: [
          0,
          -65,
          1,
          10,
          [
            [0, `#091A1E`],
            [0.8, `rgb(10,35,71)`],
            [1, `rgb(101,121,101)`],
          ],
        ],
        paths: type === 0 ? type1 : type2,
      },
      ...(type === 0
        ? [
            ...Array(3)
              .fill()
              .map((_, i) => ({
                color: "#fff",
                shadow: ["#5f0", 10],
                paths: [
                  [i * 0.8, -50],
                  [0.2 + i * 0.8, -50],
                  [0.2 + i * 0.8, -45],
                  [i * 0.8, -45],
                ],
              })),
            ...Array(3)
              .fill()
              .map((_, i) => ({
                color: "#fff",
                shadow: ["#f05", 10],
                paths:
                  (i === 1 && frame % 30 !== 0) || i !== 1
                    ? [
                        [-19.8, -20 + i * 2.4],
                        [-21.8, -20 + i * 2.4],
                        [-21.8, -22 + i * 2.4],
                        [-19.8, -22 + i * 2.4],
                      ]
                    : [],
              })),
            {
              color: "#fff",
              shadow: ["#0ff", 10],
              paths:
                frame % 30 !== 0
                  ? [
                      [14.5, -53],
                      [16.5, -53],
                      [16.5, -43],
                      [14.5, -43],
                    ]
                  : [],
            },
          ]
        : [
            {
              color: "#fff",
              shadow: ["#0ff", 10],
              paths: [
                [2.4, -35],
                [2.9, -35],
                [2.9, -10],
                [2.4, -10],
              ],
            },
          ]),
    ]);
  };

const height = 80;
const width = 480;
const root = 20;

var drawDune = (context, transformOnPlanet, [azimuth, scale, color]) => {
  drawImageOnPlanet(context, transformOnPlanet, [
    {
      color: [
        0,
        1,
        -width / 2,
        1,
        [
          [0, color[0]],
          [1, color[3]],
        ],
      ],
      paths: [
        [-width / 2, root],
        [0, -height],
        [width / 2, root],
      ],
    },
    {
      color: [
        0,
        -height,
        width / 4,
        1,
        [
          [0, color[1]],
          [0.25, color[2]],
          [1, color[3]],
        ],
      ],
      paths: [
        [width / 16, root],
        [-width / 16, -height * 0.6],
        [width / 128, -height * 0.8],
        [-width / 64, -height * 0.9],
        [0, -height - 0.1],
        [width / 2, root - 0.1],
      ],
    },
  ]);
};

const layer1 = [
  [-39.2, 5.4],
  [-38, -3.4],
  [-37.2, -3.8],
  [-37, -5.2],
  [-36.2, -5.2],
  [-35.6, -5.6],
  [-35.2, -5.2],
  [-32.4, -7],
  [-32, -6.6],
  [-29, -14.6],
  [-25.4, -18.4],
  [-24.8, -23.4],
  [-24, -25.6],
  [-22.6, -24.6],
  [-21.8, -25],
  [-20.8, -12.8],
  [-20.2, -13.8],
  [-19.2, -10.6],
  [-18.2, -12.6],
  [-16.6, -13.6],
  [-13, -5.6],
  [-10.8, 5.4],
  [-9.6, 5],
  [-4.2, -7],
  [-2.8, -8.4],
  [0.6, -15],
  [1.8, -14.8],
  [2.6, -17.4],
  [4, -19.2],
  [4.2, -21.4],
  [6.8, -22.6],
  [7.2, -17.8],
  [8, -16.8],
  [9.6, -20.2],
  [9.6, -22.2],
  [11.4, -23.6],
  [13, -21.6],
  [14.2, -16],
  [15.8, -15],
  [17.8, -19.2],
  [19.4, -21.6],
  [19, -23.2],
  [23.2, -29.2],
  [25.6, -30.2],
  [29, -27.6],
  [32.8, -22],
  [35.8, -14.4],
  [37.2, -15],
  [39, -14],
  [39.8, -11.2],
  [41.2, 5.2],
];
const layer2 = [
  [-21.2, -22.8],
  [-22, -11.6],
  [-21.4, -12.4],
  [-21.4, -9.8],
  [-22.2, -8.4],
  [-20.4, -7.2],
  [-20.8, -3.2],
  [-21.6, -1.4],
  [-21.4, 0],
  [-19.6, -2.6],
  [-17.6, 5.2],
  [-15.4, 5.2],
  [-15.4, -8.6],
  [-16.8, -8],
  [-18.2, -10],
  [-18.6, -9.4],
  [-19.8, -11],
];
const layer3 = [
  [6.6, -21.8],
  [6, -17.2],
  [5.4, -17.2],
  [4.4, -18.6],
  [4, -14.8],
  [4.8, -13],
  [2.8, -11.2],
  [4, -0.8],
  [3.8, 1.8],
  [3.2, 5],
  [39.4, 5.6],
  [37.6, 1.2],
  [35.4, -3.8],
  [36, -14.4],
  [32.6, -21.8],
  [33.4, -10.8],
  [34.2, -2.8],
  [35.6, 1.6],
  [36, 5.6],
  [26, 5.2],
  [26, 3.4],
  [27.6, -0.4],
  [26, 0.8],
  [25.6, -2.6],
  [24.8, -9.4],
  [26.4, -21],
  [23.6, -29.4],
  [24.4, -23.6],
  [22.2, -15.4],
  [23.4, -8],
  [23.4, -3.2],
  [23.4, 2.4],
  [22.8, 4.8],
  [19, 5.2],
  [19.4, -4.4],
  [18.4, -3.4],
  [18.4, -8.6],
  [16, -10.8],
  [16, -15.2],
  [13.6, -17],
  [11.8, -23],
  [12.4, -15.8],
  [12.4, -12.8],
  [13.4, -10.4],
  [14, 0.4],
  [14.4, 4.6],
  [9, 4.8],
  [8.4, -11.2],
  [7, -5.6],
  [7.4, 2.6],
  [7.4, 2.2],
  [7, 4.6],
  [5.4, 5],
  [4.2, 3],
  [4.6, -2],
  [6.4, -6.6],
  [7.8, -15],
];

var drawCanyon = (context, transformOnPlanet, [azimuth, scale, color]) => {
  drawImageOnPlanet(context, transformOnPlanet, [
    {
      color: color[0],
      paths: layer1,
    },
    {
      color: [
        0,
        -30,
        0,
        10,
        [
          [0, color[1]],
          [1, color[2]],
        ],
      ],
      paths: layer2,
    },
    {
      color: [0, -30, 0, 10, [[0, color[1], [1, color[2]]]]],
      paths: layer3,
    },
  ]);
};

const layer = [
  [-3.2, 5.4],
  [-1.6, -12],
  [-1.8, -25.4],
  [-1.8, -33.2],
  [-7.6, -39.4],
  [-10.6, -40.8],
  [-12.2, -40.8],
  [-12.4, -41.8],
  [-14, -42.8],
  [-15.4, -41.8],
  [-16.4, -43.4],
  [-15.4, -45.6],
  [-12.2, -44.6],
  [-12, -46],
  [-10.2, -46],
  [-9.2, -45.2],
  [-6.8, -46.2],
  [-5.8, -44.2],
  [-2.8, -41.8],
  [-2.8, -41],
  [-5.6, -41.4],
  [-5.6, -40.4],
  [-7.4, -41],
  [-4.6, -38],
  [-0.8, -35],
  [-1.8, -38.8],
  [-1, -40.6],
  [-1.8, -44.2],
  [-3, -43.4],
  [-4.6, -45.8],
  [-4.4, -46.6],
  [-7.2, -47],
  [-7.8, -48],
  [-7.4, -49],
  [-12, -50.4],
  [-16, -49.6],
  [-19.6, -50.8],
  [-22.2, -50.4],
  [-22.6, -53.4],
  [-22, -56.8],
  [-22.4, -58.4],
  [-18.6, -56.8],
  [-18, -58.6],
  [-13.2, -60.2],
  [-9.8, -59.4],
  [-9.4, -60.2],
  [-14.6, -62.4],
  [-14.8, -62.8],
  [-13.4, -65.2],
  [-11.4, -65.2],
  [-8.8, -64.2],
  [-6.4, -65.2],
  [-6.4, -65.6],
  [-3.2, -66.2],
  [-1.2, -65.2],
  [-0.4, -67],
  [1, -66.2],
  [3.2, -66.8],
  [10.6, -63.6],
  [10.6, -61.4],
  [13.2, -61.6],
  [14.8, -60.6],
  [16.8, -60.4],
  [16.4, -59.4],
  [20.6, -56.8],
  [20.8, -55.2],
  [15, -54.6],
  [9, -55.8],
  [12, -53.6],
  [17, -54],
  [19.6, -53.2],
  [19.6, -51.6],
  [17.8, -50.8],
  [20.4, -50.2],
  [22, -51],
  [23.6, -47.6],
  [21, -46.2],
  [21.6, -44.8],
  [20.2, -43.6],
  [18.8, -45.2],
  [16.4, -44.6],
  [12.8, -45.6],
  [7.6, -47.8],
  [4.2, -49.4],
  [4.2, -51.2],
  [1, -49.6],
  [0.8, -48.4],
  [3.2, -48.6],
  [6.8, -46.8],
  [11.4, -44],
  [5.2, -43],
  [5.6, -41.6],
  [4.4, -41.8],
  [3.8, -43.8],
  [1.4, -44],
  [1.8, -40.8],
  [1, -36.8],
  [0.8, -27.8],
  [1.2, -11.2],
  [1, 4.6],
  [1.2, 6.4],
];

var drawTree = (context, transformOnPlanet, [azimuth, scale]) => {
  drawImageOnPlanet(context, transformOnPlanet, [
    {
      color: [
        0,
        -70,
        0,
        10,
        [
          [0, "#B5C054"],
          [0.2, "#1E8152"],
          [0.5, "#112408"],
        ],
      ],
      paths: layer,
    },
  ]);
};

var getObjectRenderer = (id) => {
  switch (id) {
    case OBJECT_SATELLITE_STATION:
      return drawSatelliteStation;
    case OBJECT_BUILDING:
      return drawBuilding(0);
    case OBJECT_DUNE:
      return drawDune;
    case OBJECT_CANYON:
      return drawCanyon;
    case OBJECT_TREE:
      return drawTree;
    case OBJECT_BUILDING_2:
      return drawBuilding(1);
  }
};

function drawPlanets(context) {
  let closesetDistance = Number.MAX_VALUE;
  let closesetPlanet = undefined;

  planets.map((planet) => {
    const distance = getDistanceToPlanetSurface(planet);
    if (distance < planet.radius && distance < closesetDistance) {
      closesetPlanet = planet;
      closesetDistance = distance;
    }

    if (isPlanetVisible(planet)) {
      const { x, y } = transform(planet);
      const radius = transform(planet.radius);
      context.fillStyle = planet.color.land;
      context.beginPath();
      context.arc(x, y, radius, 0, 2 * Math.PI);
      context.fill();
    }
  });

  if (closesetPlanet && closesetPlanet !== camera.planet) {
    camera.landingAzimuth = getAngle(closesetPlanet, camera);
  }
  camera.planet = closesetPlanet;
}

function drawAtmosphere(context) {
  planets.map((planet) => {
    const { x, y } = transform(planet);
    const radius = transform(planet.radius);

    context.lineWidth = 0.3;
    context.strokeStyle = "#fff";
    context.beginPath();
    context.arc(x, y, radius * 2, 0, 2 * Math.PI);
    context.stroke();

    const grd = context.createRadialGradient(x, y, radius, x, y, radius * 2);
    planet.color.atmosphere.map((color) =>
      grd.addColorStop(color[0], color[1]),
    );
    grd.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = grd;
    context.fill();
  });
}

function drawObjects(context) {
  planets.map((planet) => {
    if (planet.objects && isPlanetVisible(planet)) {
      planet.objects.map(([azimuth, id, state]) =>
        getObjectRenderer(id)(
          context,
          (x, y) =>
            transform(getPositionOnPlanetSurface(planet, azimuth, { x, y })),
          state,
        ),
      );
    }
  });
}

function drawBackground(context) {
  planets.map((planet) => {
    if (planet.bgs && isPlanetVisible(planet)) {
      let angleDiff = getAngle(planet, camera) - camera.landingAzimuth;
      if (angleDiff < 0) angleDiff += 360;
      if (angleDiff > 180) angleDiff = angleDiff - 360;
      angleDiff = angleDiff || 0;
      planet.bgs.map(([gap, offset, id, scale = 1, distance = 0, ...args]) =>
        Array(Math.round(360 / gap))
          .fill()
          .map((_, index) => {
            const azimuth = (index * gap + offset) % 360;
            const { x, y } = getPositionOnPlanetSurface(
              planet,
              azimuth + angleDiff * distance,
            );
            const render = getObjectRenderer(id);
            if (
              render &&
              transform(Math.hypot(x - camera.x, y - camera.y)) <
                Math.hypot(window.innerWidth, window.innerHeight)
            ) {
              render(
                context,
                (x, y) => {
                  const position = getPositionOnPlanetSurface(
                    planet,
                    azimuth + angleDiff * distance,
                    {
                      x: x * scale,
                      y: y * scale,
                    },
                  );
                  return transform(position);
                },
                [azimuth, scale, args],
              );
            }
          }),
      );
    }
  });
}

function isPlanetVisible(planet) {
  const distance = getDistanceToPlanetSurface(planet);
  return (
    stage.code !== STAGE_TITLE &&
    transform(distance) < Math.hypot(window.innerWidth, window.innerHeight)
  );
}

const body = [
  [-9.6, -72.6],
  [-3.6, -75.4],
  [-3.6, -82.8],
  [-3, -84],
  [-2.2, -84.4],
  [-0.6, -84.8],
  [0.8, -84.6],
  [2, -83.2],
  [2.4, -82],
  [3.2, -75.2],
  [6.6, -73.6],
  [7.4, -40.6],
  [11, -21.4],
  [14.2, 2.6],
  [12.6, 3.2],
  [7.6, -16.8],
  [2, -33.4],
  [-1.4, -18],
  [-5, 2.8],
  [-7, 2.8],
  [-6, -12],
  [-5, -17],
  [-6.2, -37.4],
  [-10.6, -72.2],
];
const walkingBody = [
  [-9.6, -72.6],
  [-3.6, -75.4],
  [-3.6, -82.8],
  [-3, -84],
  [-2.2, -84.4],
  [-0.6, -84.8],
  [0.8, -84.6],
  [2, -83.2],
  [2.4, -82],
  [3.2, -75.2],
  [6.6, -73.6],
  [7.4, -40.6],
  [6, -21.4],
  [4.2, 2.6],
  [2.6, 3.2],
  [2.6, -16.8],
  [-6.2, -37.4],
  [-10.6, -72.2],
];
const leftArm = [
  [-14.8, -71],
  [-9.8, -72],
  [-4.8, -69.2],
  [-11.2, -49],
  [-5.2, -32.2],
  [-9.2, -30.8],
  [-16, -44.6],
];
const rightArm = [
  [2.2, -72.8],
  [7.4, -73.4],
  [11, -70.4],
  [10.8, -47.6],
  [17.8, -35.6],
  [13.4, -32.8],
  [5.4, -48.2],
];
const eye = [
  [-1.4, -81.2],
  [1.6, -81],
  [1.6, -82.2],
  [-1.6, -82.2],
];
const leftLeg = [
  [-6.2, -37.8],
  [-4, -15],
  [-4, 3.2],
  [-2, 3.2],
  [0, -15],
  [3, -37.8],
];

let frame$1 = 0;
let isFaceRight = true;

var drawCharacter = (context) => {
  const planet = camera.planet;
  const width = transform(character.width);
  const height = transform(character.height);
  let x = window.innerWidth / 2 - width / 2;
  let y = window.innerHeight / 2 - height / 2;
  frame$1 = (frame$1 + 1) % 100;

  if (isAccelerating()) {
    context.shadowColor = "#fff";
    context.shadowBlur = 20;
    const delta = transform(0.8);
    x += Math.random() * delta - delta / 2;
    y += Math.random() * delta - delta / 2;

    const fireWidth = frame$1 % 2 === 0 ? width * 0.75 : width;
    let fireHeight = frame$1 % 2 === 0 ? height * 4 : height * 2;
    const gradient = context.createLinearGradient(
      x,
      pressingKeys[38] ? y : y,
      x,
      pressingKeys[38] ? y + fireHeight : y - fireHeight,
    );
    gradient.addColorStop(0, "#fff");
    gradient.addColorStop(1, white(0));
    context.fillStyle = gradient;
    context.fillRect(
      x + width / 2 - fireWidth / 2,
      pressingKeys[38] ? y : y - fireHeight,
      fireWidth,
      !planet
        ? fireHeight
        : pressingKeys[38]
        ? Math.min(
            fireHeight,
            transform(getDistanceToPlanetSurface(planet)) + height,
          )
        : fireHeight,
    );
    context.shadowBlur = 0;
  }

  if ((pressingKeys[37] || pressingKeys[39]) && frame$1 % 3 === 0) {
    const isNeedHorizontalFire =
      !planet ||
      (planet && camera.isJumping && getDistanceToPlanetSurface(planet) > 20);
    const gravityAngle = planet ? getAngle(planet, camera) : 0;
    let rDiff = 360 - gravityAngle - camera.rotaion;
    if (rDiff < 0) rDiff += 360;

    if (isNeedHorizontalFire) {
      const fireWidth = width * 2;
      const fireHeight = width * 0.25;
      const gradient = context.createLinearGradient(
        pressingKeys[39] ? x : x + width,
        y,
        pressingKeys[39] ? x - fireWidth : x + width + fireWidth,
        y,
      );
      gradient.addColorStop(0, "#fff");
      gradient.addColorStop(1, white(0));
      context.fillStyle = gradient;
      const rectArg = [
        pressingKeys[39] ? x - fireWidth : x + width,
        planet && (rDiff <= 10 || rDiff >= 350)
          ? y - fireHeight * 2
          : y - fireHeight * 4,
        fireWidth,
        fireHeight,
      ];
      context.fillRect(...rectArg);
      context.fillRect(...rectArg);

      if (!planet || (rDiff > 10 && rDiff < 350)) {
        const gradient = context.createLinearGradient(
          pressingKeys[37] ? x : x + width,
          y,
          pressingKeys[37] ? x - fireWidth : x + width + fireWidth,
          y,
        );
        gradient.addColorStop(0, "#fff");
        gradient.addColorStop(1, white(0));
        context.fillStyle = gradient;
        const rectArg = [
          pressingKeys[37] ? x - fireWidth : x + width,
          y + height - fireHeight,
          fireWidth,
          fireHeight,
        ];
        context.fillRect(...rectArg);
        context.fillRect(...rectArg);
      }
    }
  }

  if (stage.code !== STAGE_OVER) {
    if (pressingKeys[37]) {
      isFaceRight = false;
    } else if (pressingKeys[39]) {
      isFaceRight = true;
    }
  }

  const isWalking =
    frame$1 % 25 >= 13 &&
    (pressingKeys[39] || pressingKeys[37]) &&
    stage.code !== STAGE_OVER;
  const parts = [
    rightArm,
    ...(isWalking ? [leftLeg] : []),
    !isWalking ? body : walkingBody,
    leftArm,
    eye,
  ];
  parts.map((part, partIndex) => {
    if (partIndex === (!isWalking ? 3 : 4)) {
      context.shadowColor = "#000";
      context.fillStyle = "#555";
      context.shadowBlur = 20;
    } else {
      context.shadowColor = "#555";
      context.fillStyle = "#fff";
      context.shadowBlur = 10;
    }
    context.beginPath();
    part.map(([_x, _y], index) => {
      const tNode = [
        transform(0.9 + (_x - 0.9) * (isFaceRight ? 1 : -1)) * 0.18 +
          x +
          width / 2,
        transform(_y) * 0.18 + y + height,
      ];
      if (index === 0) {
        context.moveTo(...tNode);
      } else {
        context.lineTo(...tNode);
      }
    });
    context.fill();
  });
};

const stars = Array(500)
  .fill()
  .map((_) => ({
    x: Math.random() * 15000 - 7500,
    y: Math.random() * 15000 - 7500,
    radius: Math.random() * 0.1,
  }));

var drawStars = (context) => {
  stars.forEach((star) => {
    context.fillStyle = "#fff";

    if (Math.hypot(star.x - camera.x, star.y - camera.y) > 7500) {
      star.x = Math.random() * 15000 - 7500 + camera.x;
      star.y = Math.random() * 15000 - 7500 + camera.y;
    }

    const { x, y } = transform(star, star.radius + 0.1);
    context.fillRect(x, y, 1 + star.radius / 0.1, 1 + star.radius / 0.1);
  });
};

var drawDashboard = (context) => {
  if (stage.code === STAGE_TITLE) {
    return;
  }
  const attrs = [
    ["velocity", (Math.hypot(camera.vx, camera.vy) * 10).toFixed(), 200],
    ["fuel", Math.round(camera.fuel), 100],
  ];

  const delta = 3;
  let shake = !isAccelerating()
    ? [0, 0]
    : [Math.random() * delta - delta / 2, Math.random() * delta - delta / 2];
  let x = shake[0] + 32;
  let y = shake[1] + window.innerHeight - 140;

  context.shadowColor = "#fff";
  context.shadowBlur = 20;
  attrs.map(([name, value, denominator], index) => {
    const margin = 48;

    context.font = `16px ${FONT}`;
    context.fillStyle = white(0.3);
    context.fillText(name, x, 30 + y);
    context.font = `20px ${FONT}`;
    context.fillStyle = "#fff";
    context.fillText(value, x, 52 + y);

    if (denominator) {
      const ratio = Math.min(1, value / denominator);
      context.fillStyle = "#fff";
      context.fillRect(50 + x, 40 + y, 100 * ratio, 10);
      context.fillStyle = white(0.3);
      context.fillRect(50 + x, 40 + y, 100, 10);
    }

    y += margin;
  });

  context.textAlign = "right";
  context.font = `24px ${FONT}`;
  context.fillStyle = white(0.3);
  context.fillText(
    `/${planets.length}`,
    shake[0] + (OS === "mac" ? window.innerWidth - 24 : 72),
    shake[1] + 50,
  );
  context.font = `48px ${FONT}`;
  context.fillStyle = "#fff";
  context.fillText(
    Object.keys(objectives.savedPlanets).filter(
      (planet) => objectives.savedPlanets[planet],
    ).length,
    shake[0] + (OS === "mac" ? window.innerWidth - 52 : 44),
    shake[1] + 50,
  );

  if (camera.planet) {
    const x = shake[0] + window.innerWidth - 32;
    const y = shake[1] + window.innerHeight - 90;
    const r = 32;
    const theta = getTheta(getAngle(camera.planet, camera) - 90);

    context.fillStyle = white(0.3);
    context.beginPath();
    context.arc(x - r, y, r, 0, 2 * Math.PI);
    context.fill();

    const pointR =
      32 +
      (getDistanceToPlanetSurface(camera.planet) / camera.planet.radius) * 32;
    context.fillStyle = "#fff";
    context.beginPath();
    context.arc(
      x - r + pointR * Math.cos(theta),
      y + pointR * Math.sin(theta),
      3,
      0,
      2 * Math.PI,
    );
    context.fill();

    context.font = `20px ${FONT}`;
    context.fillStyle = "#fff";
    context.textAlign = "right";
    context.fillText(camera.planet.name, x, shake[1] + window.innerHeight - 32);
  }
  context.shadowBlur = 0;
};

let isPressed = false;

var drawRadar = (context) => {
  if (pressingKeys[32] && !isNearStaelliteStation()) {
    if (!isPressed) {
      isPressed = true;
      radarWaves.push({
        send: true,
        r: 0,
        v: 0,
        x: camera.x,
        y: camera.y,
        echo: false,
      });
    }
  } else {
    isPressed = false;
  }
  for (let i = radarWaves.length - 1; i >= 0; i--) {
    const wave = radarWaves[i];

    wave.v += wave.v < 5 ? 0.1 : 0;
    wave.r += wave.v * wave.v;
    drawWave(context, wave);

    if (!wave.send) {
      if (
        wave.r / Math.hypot(camera.x - wave.x, camera.y - wave.y) >= 2 &&
        transform(wave.r - Math.hypot(camera.x - wave.x, camera.y - wave.y)) >=
          Math.hypot(window.innerWidth, window.innerHeight)
      ) {
        radarWaves.splice(i, 1);
      }
      continue;
    }

    for (let j = 0; j < planets.length; j++) {
      const planet = planets[j];
      const { savedPlanets } = objectives;
      if (savedPlanets[planet.name]) continue;

      const satelliteStation = planet.objects.find(
        (object) => object[1] === OBJECT_SATELLITE_STATION,
      );
      if (!satelliteStation) continue;

      const { x, y } = getPositionOnPlanetSurface(planet, satelliteStation[0]);
      const distance = Math.hypot(camera.x - x, camera.y - y);
      if (wave.r >= distance && !wave.echo) {
        wave.echo = true;
        radarWaves.push({
          r: 0,
          v: 0,
          x,
          y,
        });
        break;
      }
    }

    if (
      wave.echo &&
      transform(wave.r) > Math.hypot(window.innerWidth, window.innerHeight)
    ) {
      radarWaves.splice(i, 1);
    }
  }
};

function drawWave(context, wave) {
  const { x, y } = transform(wave.send ? camera : wave);
  const r = transform(wave.r);
  const grd = context.createRadialGradient(x, y, r * 0.5, x, y, r);
  grd.addColorStop(0, white(0));
  grd.addColorStop(1, white(0.3));
  context.fillStyle = grd;
  context.beginPath();
  context.arc(x, y, r, 0, 2 * Math.PI);
  context.fill();
}

const description =
  "Find the satellite station on each planet and take it offline";

let hasMoved = false;
let hasJump = false;
let hasLiftoff = false;
let hasEmitRadar = false;
let hasTurnOffStation = false;

let isGameOver = false;
let gameOverScreenOpacity = 0;

var drawStage = (context) => {
  if (stage.code === STAGE_TITLE) {
    drawTitle(context);
  } else if (stage.code === STAGE_ENDING) {
    drawEnding(context);
  } else if (stage.code === STAGE_GAME) {
    drawTutorial(context);
  } else if (stage.code === STAGE_OVER) {
    drawGameOver(context);
  }

  if (stage.code === STAGE_TITLE && pressingKeys[32]) {
    stage.startTime = Date.now();
    window.audioContext.resume();
    stage.code = STAGE_GAME;
  } else if (
    stage.code === STAGE_GAME &&
    Object.keys(objectives.savedPlanets).filter(
      (planet) => objectives.savedPlanets[planet],
    ).length === planets.length
  ) {
    stage.code = STAGE_ENDING;
    stage.endTime = Date.now();
  } else if (stage.code === STAGE_ENDING || stage.code === STAGE_OVER) {
    if (pressingKeys[82]) {
      location.reload();
    }
  }

  if (
    camera.planet &&
    getDistanceToPlanetSurface(camera.planet) <= 0 &&
    Math.hypot(camera.vx, camera.vy) > 10
  ) {
    stage.code = STAGE_OVER;
    stage.reason = OVER_REASON_CRASH;
  } else if (!camera.planet && camera.fuel === 0) {
    stage.code = STAGE_OVER;
    stage.reason = OVER_REASON_RUNNING_OUT_OF_FUEL;
  }

  if (
    stage.code === STAGE_OVER &&
    stage.reason === OVER_REASON_RUNNING_OUT_OF_FUEL &&
    camera.fuel > 0
  ) {
    stage.code = STAGE_GAME;
  }
};

function drawGameOver(context) {
  if (stage.reason === OVER_REASON_CRASH) {
    camera.vx = 0;
    camera.vy = 0;
    camera.vr = 0;

    if (!isGameOver) {
      isGameOver = true;
      gameOverScreenOpacity = 1;
    }
    gameOverScreenOpacity -= 0.005;

    if (gameOverScreenOpacity >= 0) {
      context.fillStyle = `rgba(255,255,255,${gameOverScreenOpacity})`;
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  context.shadowColor = "#fff";
  context.shadowBlur = 20;
  context.textAlign = "center";
  context.fillStyle = "#fff";

  context.font = `24px ${FONT}`;
  let text;
  if (stage.reason === OVER_REASON_CRASH) {
    text = "You must land carefully";
  } else if (stage.reason === OVER_REASON_RUNNING_OUT_OF_FUEL) {
    text = "Running out of fuel";
  }
  context.fillText(text, window.innerWidth / 2, window.innerHeight / 6);

  context.font = `24px ${FONT}`;
  context.fillText(
    `[R] Restart`,
    window.innerWidth / 2,
    window.innerHeight / 6 + 112,
  );

  context.shadowBlur = 0;
  context.textAlign = "left";
}

function drawTutorial(context) {
  if (!hasMoved && (pressingKeys[37] || pressingKeys[39])) {
    hasMoved = true;
  } else if (hasMoved && !hasJump && pressingKeys[38]) {
    hasJump = true;
  } else if (hasJump && !hasLiftoff && isAccelerating()) {
    hasLiftoff = true;
  } else if (hasLiftoff && !hasEmitRadar && pressingKeys[32]) {
    hasEmitRadar = true;
  } else if (
    !hasTurnOffStation &&
    isNearStaelliteStation() &&
    pressingKeys[32]
  ) {
    hasTurnOffStation = true;
  }

  let text;
  if (!hasMoved) {
    text = "[←][→] Move";
  } else if (!hasJump) {
    text = "[↑] Jump";
  } else if (!hasLiftoff) {
    text = "[Hold ↑] Liftoff";
  } else if (!hasEmitRadar) {
    text = "[Space] Emit Radar Wave";
  } else if (!hasTurnOffStation && isNearStaelliteStation()) {
    text = "[Space] Take Satellite Station Offline";
  } else {
    return;
  }

  context.shadowColor = "#fff";
  context.shadowBlur = 20;
  context.textAlign = "center";
  context.fillStyle = "#fff";
  context.font = `24px ${FONT}`;
  context.fillText(text, window.innerWidth / 2, window.innerHeight * 0.84);
  context.shadowBlur = 0;
  context.textAlign = "left";
}

function drawTitle(context) {
  camera.vx = 0;
  camera.vy = 0;
  camera.vr = 0;
  camera.zoom = 15;

  context.fillStyle = "#000";
  context.fillRect(0, 0, window.innerWidth, window.innerHeight);

  context.shadowColor = "#fff";
  context.shadowBlur = 20;
  context.textAlign = "center";
  context.fillStyle = "#fff";

  context.font = `72px ${FONT}`;
  context.fillText(
    "P L A N E T F A L L",
    window.innerWidth / 2,
    window.innerHeight * 0.167,
  );

  context.font = `24px ${FONT}`;
  context.fillText(
    "[Space] Start",
    window.innerWidth / 2,
    window.innerHeight * 0.84,
  );

  context.font = `16px ${FONT}`;
  context.fillText(
    description,
    window.innerWidth / 2,
    window.innerHeight * 0.74,
  );

  context.shadowBlur = 0;
}

function drawEnding(context) {
  context.shadowColor = "#fff";
  context.shadowBlur = 20;
  context.textAlign = "center";
  context.fillStyle = "#fff";

  context.font = `24px ${FONT}`;
  const time = stage.endTime - stage.startTime;
  context.fillText(
    `You saved the entire system in`,
    window.innerWidth / 2,
    window.innerHeight / 6,
  );

  context.font = `48px ${FONT}`;
  const timeText = [
    time / 3600000,
    (time % 3600000) / 60000,
    ((time % 3600000) % 60000) / 1000,
  ]
    .map((t) => t.toFixed().padStart(2, "0"))
    .join(":");
  context.fillText(
    timeText,
    window.innerWidth / 2,
    window.innerHeight / 6 + 64,
  );

  context.font = `24px ${FONT}`;
  context.fillText(
    `[R] Restart`,
    window.innerWidth / 2,
    window.innerHeight / 6 + 112,
  );

  context.shadowBlur = 0;
  context.textAlign = "left";
}

window.AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
// AudioContext must be resumed after the document received a user gesture to enable audio playback.
window.audioContext = audioContext;

const whiteNoise = audioContext.createBufferSource();
whiteNoise.buffer = noise();
whiteNoise.loop = true;
whiteNoise.start(0);
const rokcetLaunching = audioContext.createBiquadFilter();
rokcetLaunching.type = "lowpass";
whiteNoise.connect(rokcetLaunching);

const radar = audioContext.createOscillator();
radar.type = "sine";
radar.start();

const radarReverb = audioContext.createConvolver();
radarReverb.buffer = impulseResponse(4, 4, false);
radarReverb.connect(audioContext.destination);

const satellite = audioContext.createOscillator();
satellite.type = "square";
satellite.start();

const satelliteFilter = audioContext.createBiquadFilter();
satelliteFilter.type = "lowpass";
satellite.connect(satelliteFilter);

const satelliteReverb = audioContext.createConvolver();
satelliteReverb.buffer = impulseResponse(1, 5, false);
satelliteReverb.connect(audioContext.destination);

let playingRadarSound = false;
let satelliteFrequency = 0;

var updateSound = () => {
  if (camera.planet) {
    const distance = getDistanceToPlanetSurface(camera.planet);
    const distanceRatio = 1 - distance / camera.planet.radius;
    rokcetLaunching.frequency.setValueAtTime(
      250 * distanceRatio + 250,
      audioContext.currentTime,
    );
  }

  if (isAccelerating()) {
    rokcetLaunching.connect(audioContext.destination);
  } else {
    rokcetLaunching.disconnect();
  }

  const echoWave = radarWaves.find((wave) => !wave.send);
  const isEchoArrived =
    echoWave &&
    echoWave.r > Math.hypot(camera.x - echoWave.x, camera.y - echoWave.y);

  if (pressingKeys[32]) {
    radar.frequency.setValueAtTime(1046, audioContext.currentTime);
  } else if (isEchoArrived) {
    radar.frequency.setValueAtTime(
      440 + Math.max(0, 440 - (echoWave.r / 4000) * 440),
      audioContext.currentTime,
    );
  }

  if ((pressingKeys[32] && !isNearStaelliteStation()) || isEchoArrived) {
    if (playingRadarSound) return;
    radar.connect(radarReverb);
    playingRadarSound = true;
    setTimeout(() => radar.disconnect(), 100);
  } else {
    radar.disconnect();
    playingRadarSound = false;
  }

  if (pressingKeys[32] && isNearStaelliteStation()) {
    satelliteFrequency = 110;
  }

  if (satelliteFrequency <= 10) {
    satelliteFilter.disconnect();
  } else {
    satellite.frequency.setValueAtTime(
      satelliteFrequency,
      audioContext.currentTime,
    );
    satelliteFilter.frequency.setValueAtTime(
      satelliteFrequency * 2,
      audioContext.currentTime,
    );
    satelliteFrequency -= 1;
    satelliteFilter.connect(satelliteReverb);
  }
};

function impulseResponse(duration, decay = 2.0, reverse) {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);
  const impulseL = impulse.getChannelData(0);
  const impulseR = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = reverse ? length - i : i;
    impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
  }
  return impulse;
}

function noise() {
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(
    1,
    bufferSize,
    audioContext.sampleRate,
  );
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

window.addEventListener(
  "keydown",
  ({ keyCode }) => (pressingKeys[keyCode] = true),
);
window.addEventListener("keyup", ({ keyCode }) => delete pressingKeys[keyCode]);
window.addEventListener(
  "touchstart",
  (e) => (pressingKeys[mapTouchEventToKeyCode(e)] = true),
);
window.addEventListener("touchend", (e) =>
  Object.keys(pressingKeys).map((key) => delete pressingKeys[key]),
);

function tick() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  updateCamera();
  updateObjective();
  updateSound();
  drawStars(context);
  drawAtmosphere(context);
  drawBackground(context);
  drawObjects(context);
  drawPlanets(context);
  drawStage(context);
  drawRadar(context);
  drawDashboard(context);
  drawCharacter(context);

  requestAnimationFrame(tick);
}
tick();

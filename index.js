const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;


const width = 600;
const height = 600;
const cellsHorizontal = 6;
const cellsVertival = 6;
const unitLengthX = width / cellsHorizontal;
const unitLengthY = width / cellsVertival;
const container = document.querySelector('.container')
let current;
const stack = []

const engine = Engine.create();
engine.world.gravity.y = 0
const { world } = engine;
const render = Render.create({
    element: container,
    engine: engine,
    options: {
        wireframes: true,
        width: width,
        height: height
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];
World.add(world, walls);


const grid = Array(cellsVertival).fill(null).map(() => Array(cellsHorizontal).fill(false))
const verticals = Array(cellsVertival).fill(null).map(() => Array(cellsHorizontal - 1).fill(false))
const horizontals = Array(cellsVertival - 1).fill(null).map(() => Array(cellsHorizontal).fill(false))

const startRow = Math.floor(Math.random() * cellsVertival);
const startColumn = Math.floor(Math.random() * cellsHorizontal)

const shuffle = (arr) => {
    let count = arr.length
    while (count > 0) {
        const index = Math.floor(Math.random() * count)
        count--
        const temp = arr[count]
        arr[count] = arr[index]
        arr[index] = temp
    }
    return arr
}

const stepThroughCell = (row, column) => {
    // If i have visted the cell at [row][column], then return
    if (grid[row][column]) {
        return
    }
    grid[row][column] = true

    current = [row, column]

    // Mark this cell as being visited
    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ])

    let foundCorrectNeighbour = false
    // For each neighbor....
    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor
        // See if that neighbor is out of bounds
        if (nextRow < 0 || nextRow >= cellsVertival || nextColumn < 0 || nextColumn >= cellsHorizontal) {
            continue;
        }
        // If we have visited that neighbor, continue to next neighbor
        if (grid[nextRow][nextColumn]) {
            continue
        }
        stack.push(current)
        foundCorrectNeighbour = true
        // Remove a wall from either horizontals or verticals
        if (direction === 'left') {
            verticals[row][column - 1] = true
        } else if (direction === 'right') {
            verticals[row][column] = true
        } else if (direction === 'up') {
            horizontals[row - 1][column] = true
        } else if (direction === 'down') {
            horizontals[row][column] = true
        }
        // Visit that next cell
        stepThroughCell(nextRow, nextColumn)
    }

    if (!foundCorrectNeighbour) {
        const [row, column] = stack.pop()
        stepThroughCell(row, column)
    }
};

stepThroughCell(startRow, startColumn)
//console.log(neighbors)

horizontals.forEach((row, rowIndex) => {
    row.forEach((column, columnIndex) => {
        if (column) {
            return
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            2,
            {
                isStatic: true,
                label: 'wall'
            }
        )
        World.add(world, wall)
    })
})

verticals.forEach((row, rowIndex) => {
    row.forEach((column, columnIndex) => {
        if (column) {
            return
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            2,
            unitLengthY,
            {
                isStatic: true,
                label: 'wall'
            }
        )
        World.add(world, wall)
    })
})

// Goal
const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * .5,
    unitLengthY * .5,
    {
        render: {
            fillStyle: 'green',
            strokeStyle: 'green',
            lineWidth: 3
        },
        isStatic: true,
        label: 'goal'
    }
)

World.add(world, goal)


// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
    label: 'ball'
})
World.add(world, ball)

document.addEventListener('keydown', (event) => {
    const { x, y } = ball.velocity
    if (event.keyCode === 38) {
        //up
        Body.setVelocity(ball, { x, y: y - 3 })
    }
    if (event.keyCode === 39) {
        //right
        Body.setVelocity(ball, { x: x + 3, y })
    }
    if (event.keyCode === 40) {
        //down
        Body.setVelocity(ball, { x, y: y + 3 })
    }
    if (event.keyCode === 37) {
        //left
        Body.setVelocity(ball, { x: x - 3, y })
    }
})

// Win Condition
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach((collision) => {
        const labels = ['ball', 'goal']
        if (
            labels.includes(collision.bodyA.label) &&
            labels.includes(collision.bodyB.label)
        ) {
            document.querySelector('.winner').classList.remove('hidden')
            world.gravity.y = 1
            world.bodies.forEach((item) => {
                if (item.label === 'wall') {
                    Body.setStatic(item, false)
                }
            })
        }
    })
})
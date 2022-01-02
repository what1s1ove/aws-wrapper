import { resolve } from 'node:path'
import Fastify from 'fastify'
import fastifyStatic from 'fastify-static'
import { config } from 'dotenv'
import { EC2Client, RunInstancesCommand } from '@aws-sdk/client-ec2'

config()

const { PORT, AWS_REGION, AWS_ACCESS_KEY, AWS_SECRET_KEY } = process.env

const Env = {
  APP_PORT: PORT,
  AWS_REGION,
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
}

const hasAllEnv = Object.values(Env).every(Boolean)

if (!hasAllEnv) {
  throw new Error('Not all Env provided')
}
const app = Fastify({
  logger: true,
})

const ec2Client = new EC2Client({
  region: Env.AWS_REGION,
  accessKeyId: Env.AWS_ACCESS_KEY,
  secretAccessKey: Env.AWS_SECRET_KEY,
})

app.register(fastifyStatic, {
  root: resolve('public'),
})

app.post('/aws-create-ec2', async (request, _reply) => {
  const instanceParams = {
    ImageId: request.body.imageId,
    InstanceType: request.body.instanceType,
    MinCount: 1,
    MaxCount: 1,
  }

  const data = await ec2Client.send(new RunInstancesCommand(instanceParams))

  const [instance] = data.Instances

  const { InstanceId: instanceId } = instance

  return { instanceId }
})

app.listen(Env.APP_PORT, (err, address) => {
  if (err) {
    throw err
  }
  console.log(`Server is now listening on ${address}`)
})

import winston from 'winston';
require('winston-daily-rotate-file');

export let Logger = winston.createLogger({
	level: 'verbose',
	transports: [
		new (winston.transports as any).DailyRotateFile({ dirname: process.env.LOG_PATH ? `${process.env.LOG_PATH}/botlogs` : './logs' }),
		new winston.transports.Console({ format: winston.format.simple() }),
		new winston.transports.File({
			filename: process.env.LOG_PATH ? `${process.env.LOG_PATH}/botlogs/error.log` : './logs/error.log',
			level: 'error',
		}),
	],
});


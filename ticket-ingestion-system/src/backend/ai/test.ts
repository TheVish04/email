import { classifyTicket } from './classifier';

const test = async () => {
    const result = await classifyTicket('My laptop screen is broken');
    console.log(result);
};

test();
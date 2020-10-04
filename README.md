# Your Personal Nagger

This web app allows the user to log data for self evaluation, it's like someone nagging you all the time asking you: are you doing this? Are you doing that?

The cool thing is that it will nag you the way you want it to.

### Use
Clone the repo locally. Modify the questions.csv file in the /etch/csv/ direrctory the way you want and launch the node server locally:

```
node run.js
```

Alternatively you can double click on the .bat file.

As a note: make sure your question have a unique identifier *idq* and preferrably the names of the areas and targets are one word long. You can add a longer description in the /etch/csv/descriptions.csv file.

### Future Development
At the moment answers are saved in JSON format in the /public/data folder. In the future answers will be saved in a non-public folder, potentially in a .csv format.

The plan is to have another section where user can specify the level of priority for each area for each target, so that the nagger will ask the questions in the order that is more relevant for the user.
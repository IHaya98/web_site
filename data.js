var ganttData = [
	{
		id: 1, name: "Feature 1", series: [
			{ name: "Planned", start: new Date(2020,00,01,08,00), end: new Date(2020,00,03,18,00) },
			{ name: "Actual", start: new Date(2020,00,02,08,00), end: new Date(2020,00,05,18,00), color: "#f0f0f0" }
		]
	},
	{
		id: 2, name: "Feature 2", series: [
			{ name: "Planned", start: new Date(2020,00,01,08,00), end: new Date(2020,00,03,18,00) },
			{ name: "Actual", start: new Date(2020,00,02,08,00), end: new Date(2020,00,05,18,00), color: "#f0f0f0" },
			{ name: "Projected", start: new Date(2020,00,02,08,00), end: new Date(2020,00,05,18,00), color: "#f0f0f0" }
		]
	}
];
function SankeyDiagram(container, data) {
    let marginSankey = { top: 0, right: 0, bottom: 0, left: 0 };
    let fullWidthSankey = window.innerWidth * 0.45;
    let fullHeightSankey = window.innerHeight * 0.45;
    let widthSankey = fullWidthSankey - marginSankey.right - marginSankey.left;
    let heightSankey = fullHeightSankey - marginSankey.top - marginSankey.bottom;

    let svgSankey;
    let formatNumberSankey;
    let formatSankey;
    let colorSankey;
    let sankey;
    let linkSankey;
    let nodeSankey;

    let field_options = {};
    let sankey_data = [];
    let nodes = [];
    let node_to_index = {};
    let sankey_table = [];
    let links = [];
    let sankey_json = {};
    let num_entries = 0;

    let zero_table = get_zero_table(24);



    d3.csv('data/PoliceKillingsUS.csv', (data) => {
        sankey_json = format_data_to_sankey(data);
        initSankey();
    });

    function initSankey() {
        svgSankey =
            d3.select('#sankey-holder')
                .append('svg')
                .attr('width', fullWidthSankey)
                .attr('height', fullHeightSankey)
                .append('g')
                .attr('transform', 'translate(' + marginSankey.left + ',' + marginSankey.top + ')');
        // format variables
        formatNumberSankey = d3.format(',.2f'); // 2 decimal places
        formatSankey = function (d) {
            return (formatNumberSankey(d / num_entries * 100)) + '% of shootings';
        }
        colorSankey = d3.scaleOrdinal(d3.schemeCategory20);
        // sankey diagram properties
        sankey = d3.sankey()
            .nodeWidth(10)
            .nodePadding(10)
            .extent([[1, 1], [widthSankey - 1, heightSankey - 6]]);
        linkSankey = svgSankey.append('g')
            .attr('class', 'links-sankey')
            .attr('fill', 'none')
            .attr('stroke', '#000')
            .attr('stroke-opacity', 0.2)
            .selectAll('path');
        nodeSankey = svgSankey.append('g')
            .attr('class', 'nodes-sankey')
            .attr('font-family', 'sans-serif')
            .attr('font-size', 10)
            .selectAll('g');
        sankey(sankey_json);
        linkSankey = linkSankey
            .data(sankey_json['links'])
            .enter().append('path')
            .attr('d', d3.sankeyLinkHorizontal())
            .attr('stroke-width', (d) => {
                return Math.max(1, d.width);
            });
        linkSankey.append('title')
            .text((d) => {
                return d.source.name + " -> " + d.target.name + "\n" + formatSankey(d.value);
            });
        nodeSankey = nodeSankey
            .data(sankey_json['nodes'])
            .enter().append('g');
        nodeSankey.append('rect')
            .attr('x', (d) => { return d.x0; })
            .attr('y', (d) => { return d.y0; })
            .attr('height', (d) => { return d.y1 - d.y0; })
            .attr('width', (d) => { return d.x1 - d.x0; })
            .attr('fill', (d) => { return colorSankey(d.name.replace(/ .*/, "")); })
            .attr('stroke', '#000');
        nodeSankey.append('text')
            .attr('x', (d) => { return d.x0 - 6; })
            .attr('y', (d) => { return (d.y1 + d.y0) / 2; })
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .text((d) => { return d.name; })
            .filter((d) => { return d.x0 < widthSankey / 2; })
            .attr('x', (d) => { return d.x1 + 6; })
            .attr('text-anchor', 'start');
        nodeSankey.append('title')
            .text((d) => { return d.name + '\n' + formatSankey(d.value); });
    }

    this.update = function (data, selection) {
        svgSankey.selectAll('*').remove();
    }

    function get_links(table, node_to_index) {
        let links = [];
        for (i = 0; i < table.length; i++) {
            for (j = 0; j < table[0].length; j++) {
                if (table[i][j] !== 0) {
                    links.push({ 'source': i, 'target': j, 'value': table[i][j] });
                }
            }
        }
        return links;
    }

    function get_table(data, node_to_index, zero_table) {
        let table = zero_table;
        for (entry of data) {
            let genderIndex = node_to_index[entry['gender']];
            let raceIndex = node_to_index[entry['race']];
            let mentalIndex = node_to_index[entry['signs_of_mental_illness']];
            let fleeIndex = node_to_index[entry['flee']];
            let armedIndex = node_to_index[entry['armed']];
            let threatIndex = node_to_index[entry['threat_level']];
            let bodycamIndex = node_to_index[entry['body_camera']];

            table[genderIndex][raceIndex]++;
            table[raceIndex][mentalIndex]++;
            table[mentalIndex][fleeIndex]++;
            table[fleeIndex][armedIndex]++;
            table[armedIndex][threatIndex]++;
            table[threatIndex][bodycamIndex]++;
        }
        return table;
    }

    function format_data_to_sankey(data) {
        console.log(data);
        let sankey_data = [];
        let sankey_entry = {};
        let mapping = {
            'gun': 'armed',
            'unarmed': 'unarmed',
            'hand weapon': 'hand weapon',
            'vehicle': 'vehicle',
            'undetermined if armed': 'undetermined if armed',
            'm': 'male',
            'f': 'female',
            'a': 'asian',
            'w': 'white',
            'h': 'hispanic',
            'b': 'black',
            'o': 'other race',
            'n': 'native american',
            'mentally ill': 'mentally ill',
            'not mentally ill': 'not mentally ill',
            'attack': 'attacking',
            'not attacking': 'not attacking',
            'undetermined': 'undetermined',
            'not fleeing': 'not fleeing',
            'car': 'fleeing by car',
            'foot': 'fleeing on foot',
            'other': 'unsure',
            'no body camera': 'no body camera',
            'body camera': 'body camera',
        }
        for (entry of data) {
            if (entry['flee'] === '' || entry['race'] === '' || entry['armed'] === '') {
                continue;
            }
            sankey_entry = {};
            for (key in entry) {
                sankey_entry[key] = entry[key].toLowerCase();
            }

            if (sankey_entry['armed'].includes('gun')) {
                sankey_entry['armed'] = 'gun';
            } else if (sankey_entry['armed'].includes('vehicle') || sankey_entry['armed'].includes('motorcycle')) {
                sankey_entry['armed'] = 'vehicle';
            } else if (sankey_entry['armed'].includes('undetermined')) {
                sankey_entry['armed'] = 'undetermined if armed';
            } else if (sankey_entry['armed'].includes('unarmed')) {
                sankey_entry['armed'] = 'unarmed';
            } else {
                sankey_entry['armed'] = 'hand weapon';
            }

            if (sankey_entry['body_camera'] === 'true') {
                sankey_entry['body_camera'] = 'body camera';
            } else {
                sankey_entry['body_camera'] = 'no body camera';
            }

            if (sankey_entry['signs_of_mental_illness'] === 'true') {
                sankey_entry['signs_of_mental_illness'] = 'mentally ill';
            } else {
                sankey_entry['signs_of_mental_illness'] = 'not mentally ill';
            }

            if (sankey_entry['threat_level'] === 'other') {
                sankey_entry['threat_level'] = 'not attacking';
            }

            for (key in sankey_entry) {
                sankey_entry[key] = mapping[sankey_entry[key]];
            }
            num_entries++;
            sankey_data.push(sankey_entry);
        }
        field_options = get_all_field_options(sankey_data);
        console.log(field_options);
        nodes = get_nodes(field_options);
        console.log(nodes);
        node_to_index = get_node_to_index_mapping(nodes);
        console.log(node_to_index);
        sankey_table = get_table(sankey_data, node_to_index, zero_table);
        console.log(sankey_table);
        links = get_links(sankey_table, node_to_index);
        console.log(links);

        return { 'nodes': nodes, 'links': links };
    }

    function get_all_field_options(dataset) {
        let options = {};

        for (entry of dataset) {
            for (key in entry) {
                if (!(key in options)) {
                    options[key] = [entry[key]];
                } else {
                    if (!options[key].includes(entry[key])) {
                        options[key].push(entry[key]);
                    }
                }
            }
        }
        delete options['age'];
        delete options['city'];
        delete options['date'];
        delete options['id'];
        delete options['name'];
        delete options['state'];
        delete options['manner_of_death'];
        return options;
    }

    function get_nodes(options) {
        let nodes = [];
        for (key in options) {
            for (item of options[key]) {
                nodes.push({ 'name': item });
            }
        }
        return nodes;
    }

    function get_node_to_index_mapping(nodes) {
        let node_to_index = {};
        let i = 0;
        for (node_dict of nodes) {
            node_to_index[node_dict['name']] = i;
            i++;
        }
        return node_to_index;
    }

    function get_zero_table(size) {
        let table = [];
        for (i = 0; i < size; i++) {
            table.push([]);
            for (j = 0; j < size; j++) {
                table[i].push(0);
            }
        }
        return table;
    }
}
(ns pprint
  (:require [clojure.string :as str]
            [clojure.pprint :as pprint]))

(defn- unique-keys
  [maps]
  (reduce into (sorted-set) (map keys maps)))

(defn print-table'
  "Like clojure.pprint/print-table but always computes headings from all rows"
  [rows]
  (pprint/print-table (unique-keys rows) rows))

(defn- left-align
  "Left-align (right-pad) value up to width by repeating chr as padding material"
  [chr width value]
  (let [string (str value)]
    (str string (str/join (repeat (- width (count string)) chr)))))

(defn render-table
  "Lazily iterate over the lines of a markdown-like table generated from rows.
  Like clojure.pprint/print-table but returns seq of lines and left-aligns cell contents."
  [maps]
  (let [ks (unique-keys maps)
        header (map #(str " " % " ") ks)
        rows (map (fn [m] (map #(str " " (get m %) " ") ks)) maps)
        rowswidths (map #(map count %) (cons header rows))
        widths (apply map max rowswidths)
        rules (map #(str/join (repeat % "-")) widths)]
    (for [cells (list* header rules rows)]
      (str/join "|" (map (fn [cell width] (left-align " " width cell)) cells widths)))))

(defn print-table
  [maps]
  (dorun (map println (render-table maps))))
